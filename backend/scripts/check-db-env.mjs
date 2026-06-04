import "dotenv/config";
import { getDbConfig, pool } from "../src/config/db.js";

const config = getDbConfig();
const present = {
  DATABASE_URL: Boolean(process.env.DATABASE_URL),
  MYSQL_URL: Boolean(process.env.MYSQL_URL),
  MYSQL_URL_PUBLIC: Boolean(process.env.MYSQL_URL_PUBLIC),
  MYSQLHOST: Boolean(process.env.MYSQLHOST),
  MYSQLPORT: Boolean(process.env.MYSQLPORT),
  MYSQLUSER: Boolean(process.env.MYSQLUSER),
  MYSQLPASSWORD: Boolean(process.env.MYSQLPASSWORD),
  MYSQLDATABASE: Boolean(process.env.MYSQLDATABASE),
  DB_HOST: Boolean(process.env.DB_HOST),
  DB_PORT: Boolean(process.env.DB_PORT),
  DB_USER: Boolean(process.env.DB_USER),
  DB_PASSWORD: Boolean(process.env.DB_PASSWORD),
  DB_NAME: Boolean(process.env.DB_NAME),
};

try {
  const connection = await pool.getConnection();
  connection.release();
  await pool.end();
  console.log(JSON.stringify({
    ok: true,
    present,
    resolved: {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      hasPassword: Boolean(config.password),
    },
  }, null, 2));
} catch (error) {
  await pool.end();
  console.log(JSON.stringify({
    ok: false,
    present,
    resolved: {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      hasPassword: Boolean(config.password),
    },
    error: {
      code: error.code,
      message: error.message,
    },
  }, null, 2));
  process.exit(1);
}
