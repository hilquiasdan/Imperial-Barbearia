import { initDb } from './db.js';

async function checkUsers() {
  const db = await initDb();
  const users = await db.all('SELECT id, username, name, role, barberId FROM users');
  console.log(JSON.stringify(users, null, 2));
}

checkUsers().catch(console.error);
