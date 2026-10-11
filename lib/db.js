import mysql from 'mysql2/promise';

function buildConfig() {
  const url = new URL(process.env.DATABASE_URL || 'mysql://root:@127.0.0.1:3306/atk_kahfi');
  const cfg = {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    waitForConnections: true,
    connectionLimit: 5,
    decimalNumbers: true,
    dateStrings: true,
  };
  if (process.env.DB_SSL === 'true') cfg.ssl = { rejectUnauthorized: true };
  return cfg;
}

const g = globalThis;
export const pool = g.__atkPool || (g.__atkPool = mysql.createPool(buildConfig()));

// Mengembalikan baris hasil (SELECT) atau ResultSetHeader (INSERT/UPDATE/DELETE)
export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Menjalankan beberapa query dalam satu transaksi
export async function tx(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const hasil = await fn(conn);
    await conn.commit();
    return hasil;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
