import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dbPath = path.resolve(process.cwd(), 'imperial.db');

// Open the database
export const initDb = async () => {
  console.log(`Iniciando banco de dados em: ${dbPath}`);
  
  // Test if directory is writable
  try {
    const dir = path.dirname(dbPath);
    fs.accessSync(dir, fs.constants.W_OK);
    console.log(`Diretório ${dir} tem permissão de escrita.`);
  } catch (err) {
    console.error(`AVISO: O diretório do banco de dados pode não ter permissão de escrita!`, err);
  }

  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.run('PRAGMA foreign_keys = ON');

    // Initialize tables
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
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    throw error;
  }
};
