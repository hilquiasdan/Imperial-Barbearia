import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'imperial.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
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

export default db;
