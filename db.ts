import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mysql from 'mysql2/promise';
import path from 'path';

export const dbPath = path.resolve(process.cwd(), 'imperial.db');

// Unified Database Interface
export interface DB {
  get: (sql: string, ...params: any[]) => Promise<any>;
  all: (sql: string, ...params: any[]) => Promise<any[]>;
  run: (sql: string, ...params: any[]) => Promise<{ lastID?: any; changes?: number }>;
  exec: (sql: string) => Promise<void>;
}

// MySQL Wrapper
class MySQLWrapper {
  pool;
  constructor(pool) {
    this.pool = pool;
  }

  async get(sql, ...params) {
    let connection;
    try {
      connection = await this.pool.getConnection();
      const [rows] = await connection.execute(sql, params);
      return rows[0];
    } catch (error) {
      console.error(`MySQL GET Error [${sql}]:`, error.message);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  async all(sql, ...params) {
    let connection;
    try {
      connection = await this.pool.getConnection();
      const [rows] = await connection.execute(sql, params);
      return rows;
    } catch (error) {
      console.error(`MySQL ALL Error [${sql}]:`, error.message);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  async run(sql, ...params) {
    let connection;
    try {
      connection = await this.pool.getConnection();
      const [result] = await connection.execute(sql, params);
      return { lastID: result.insertId, changes: result.affectedRows };
    } catch (error) {
      console.error(`MySQL RUN Error [${sql}]:`, error.message);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  async exec(sql) {
    let connection;
    try {
      connection = await this.pool.getConnection();
      const statements = sql.split(';').filter(s => s.trim());
      for (const s of statements) {
        await connection.query(s);
      }
    } catch (error) {
      console.error(`MySQL EXEC Error:`, error.message);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }
}

export const initDb = async () => {
  // Check if MySQL environment variables are present and not just placeholders
  const useMySQL = process.env.DB_HOST && 
                   process.env.DB_USER && 
                   process.env.DB_NAME;

  if (useMySQL) {
    console.log(`Tentando conectar ao banco de dados MySQL:`);
    console.log(`- Host: ${process.env.DB_HOST}`);
    console.log(`- Port: ${process.env.DB_PORT || 3306}`);
    console.log(`- User: ${process.env.DB_USER}`);
    console.log(`- Database: ${process.env.DB_NAME}`);
    
    try {
      const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000
      });

      console.log("Pool de conexões MySQL criado com sucesso!");
      const db = new MySQLWrapper(pool);

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

      return db;
    } catch (error) {
      console.error("ERRO ao conectar ao MySQL da Hostinger:", error);
      console.log("Usando SQLite local como fallback para manter o site online.");
    }
  }

  // Fallback to SQLite
  console.log(`Iniciando banco de dados SQLite local em: ${dbPath}`);
  
  let db;
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
  } catch (error) {
    if (error.message.includes('SQLITE_CORRUPT')) {
      console.error("Banco de dados SQLite corrompido detectado. Tentando recriar...");
      const fs = await import('fs/promises');
      try {
        await fs.unlink(dbPath);
        db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });
      } catch (unlinkError) {
        console.error("Falha ao recriar banco de dados SQLite:", unlinkError);
        throw error;
      }
    } else {
      throw error;
    }
  }

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

  return db;
};
