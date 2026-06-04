import mysql from "mysql2/promise";

export function getDbConfig() {
  const url = process.env.DATABASE_URL ?? process.env.MYSQL_URL ?? process.env.MYSQL_URL_PUBLIC;
  if (url) {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: Number(parsed.port || 3306),
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, "") || "railway",
      };
    } catch {
      console.warn("Ignoring invalid database URL. Check DATABASE_URL, MYSQL_URL, or MYSQL_URL_PUBLIC.");
    }
  }

  return {
    host: process.env.DB_HOST ?? process.env.MYSQLHOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? process.env.MYSQLPORT ?? 3306),
    user: process.env.DB_USER ?? process.env.MYSQLUSER ?? "root",
    password: process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD ?? "",
    database: process.env.DB_NAME ?? process.env.MYSQLDATABASE ?? "campus_trade",
  };
}

export const pool = mysql.createPool({
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

export async function query(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function transaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
