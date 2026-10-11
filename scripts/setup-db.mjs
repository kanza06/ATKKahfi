// Membuat database, tabel, dan akun admin pertama.
// Jalankan: npm run db:setup
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv(path.join(root, '.env.local'));
loadEnv(path.join(root, '.env'));

const url = new URL(process.env.DATABASE_URL || 'mysql://root:@127.0.0.1:3306/atk_kahfi');
const dbName = url.pathname.replace(/^\//, '') || 'atk_kahfi';
const base = {
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  multipleStatements: true,
};
if (process.env.DB_SSL === 'true') base.ssl = { rejectUnauthorized: true };

const conn = await mysql.createConnection(base);

try {
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
} catch (e) {
  console.log('Catatan: database tidak dibuat otomatis (' + e.message + '). Lanjut memakai database yang sudah ada.');
}
await conn.query(`USE \`${dbName}\``);
await conn.query(fs.readFileSync(path.join(root, 'db', 'schema.sql'), 'utf8'));
console.log('Tabel siap.');

const [admins] = await conn.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
if (admins.length === 0) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const nama = process.env.ADMIN_NAMA || 'Pemilik ATK Kahfi';
  const hash = await bcrypt.hash(password, 10);
  await conn.query('INSERT INTO users (nama, username, password_hash, role) VALUES (?, ?, ?, ?)', [nama, username, hash, 'admin']);
  console.log(`Akun admin dibuat -> username: ${username} | password: ${password}`);
  console.log('Segera ganti password setelah login pertama (menu Pengguna).');
} else {
  console.log('Akun admin sudah ada, dilewati.');
}

await conn.end();
console.log('Selesai.');
