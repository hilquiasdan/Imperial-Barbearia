import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dbPath = path.resolve(process.cwd(), 'imperial.db');

// Unified Database Interface
// (Interfaces removed for JS compatibility)

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
                   process.env.DB_NAME &&
                   process.env.DB_PASSWORD;

  if (useMySQL) {
    console.log(`Tentando conectar ao banco de dados MySQL da Hostinger...`);
    
    try {
      const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        connectTimeout: 15000
      });

      const db = new MySQLWrapper(pool);
      
      // Test connection
      const conn = await pool.getConnection();
      conn.release();
      console.log("Conexão MySQL estabelecida com sucesso!");

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
          INDEX idx_date (date)
        );

        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          barberId VARCHAR(255)
        );
      `);

      return db;
    } catch (error) {
      console.error("FALHA ao conectar ao MySQL da Hostinger:", error.message);
      console.log("Usando SQLite local temporariamente para evitar erro 503.");
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
    console.error("Erro ao abrir SQLite:", error.message);
    throw error;
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
      price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      barberId TEXT
    );
  `);

  return db;
};
