import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dbPath = path.resolve(process.cwd(), 'imperial.db');

// Unified Database Interface
export interface DB {
  get: (sql: string, ...params: any[]) => Promise<any>;
  all: (sql: string, ...params: any[]) => Promise<any[]>;
  run: (sql: string, ...params: any[]) => Promise<{ lastID?: any; changes?: number }>;
  exec: (sql: string) => Promise<void>;
}

// MySQL Wrapper
class MySQLWrapper implements DB {
  constructor(private connection: mysql.Connection) {}

  async get(sql: string, ...params: any[]) {
    const [rows]: any = await this.connection.execute(sql, params);
    return rows[0];
  }

  async all(sql: string, ...params: any[]) {
    const [rows]: any = await this.connection.execute(sql, params);
    return rows;
  }

  async run(sql: string, ...params: any[]) {
    const [result]: any = await this.connection.execute(sql, params);
    return { lastID: result.insertId, changes: result.affectedRows };
  }

  async exec(sql: string) {
    try {
      await this.connection.query(sql);
    } catch (error) {
      // If multipleStatements is not working as expected, fallback to splitting
      const statements = sql.split(';').filter(s => s.trim());
      for (const s of statements) {
        try {
          await this.connection.execute(s);
        } catch (innerError) {
          console.error("Erro ao executar statement individual:", s, innerError);
        }
      }
    }
  }
}

// SQLite Wrapper (already provided by 'sqlite' package, but we'll wrap to match if needed)
// Actually, the 'sqlite' package already has get, all, run, exec.

export const initDb = async (): Promise<DB> => {
  const useMySQL = process.env.DB_HOST && process.env.DB_USER;

  if (useMySQL) {
    console.log("Conectando ao banco de dados MySQL...");
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
      });

      const db = new MySQLWrapper(connection);

      // Initialize tables (MySQL syntax)
      await db.exec(`
        CREATE TABLE IF NOT EXISTS barbers (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          image TEXT,
          phone VARCHAR(50)
        );

        CREATE TABLE IF NOT EXISTS services (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          duration INT NOT NULL,
          image TEXT,
          description TEXT
        );

        CREATE TABLE IF NOT EXISTS appointments (
          id VARCHAR(255) PRIMARY KEY,
          clientName VARCHAR(255) NOT NULL,
          clientPhone VARCHAR(50) NOT NULL,
          serviceId VARCHAR(255) NOT NULL,
          barberId VARCHAR(255) NOT NULL,
          date VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'confirmed',
          price DECIMAL(10, 2) NOT NULL,
          CONSTRAINT fk_service FOREIGN KEY (serviceId) REFERENCES services(id),
          CONSTRAINT fk_barber FOREIGN KEY (barberId) REFERENCES barbers(id)
        );

        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          barberId VARCHAR(255),
          CONSTRAINT fk_user_barber FOREIGN KEY (barberId) REFERENCES barbers(id)
        );
      `);

      console.log("MySQL inicializado com sucesso.");
      return db;
    } catch (error) {
      console.error("Erro ao conectar ao MySQL, tentando SQLite como fallback...", error);
    }
  }

  // Fallback to SQLite
  console.log(`Iniciando banco de dados SQLite em: ${dbPath}`);
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.run('PRAGMA foreign_keys = ON');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS barbers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      image TEXT,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      duration INTEGER NOT NULL,
      image TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      clientName TEXT NOT NULL,
      clientPhone TEXT NOT NULL,
      serviceId TEXT NOT NULL,
      barberId TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed',
      price REAL NOT NULL,
      FOREIGN KEY (serviceId) REFERENCES services(id),
      FOREIGN KEY (barberId) REFERENCES barbers(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      barberId TEXT,
      FOREIGN KEY (barberId) REFERENCES barbers(id)
    );
  `);

  return db as any;
};
