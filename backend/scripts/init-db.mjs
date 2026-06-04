import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../src/config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.resolve(__dirname, "../sql");

function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean)
    .filter((statement) => !/^CREATE\s+DATABASE\b/i.test(statement))
    .filter((statement) => !/^USE\b/i.test(statement));
}

async function runFile(fileName) {
  const filePath = path.join(sqlDir, fileName);
  const sql = await fs.readFile(filePath, "utf8");
  const statements = splitStatements(sql);
  for (const statement of statements) {
    await pool.execute(statement);
  }
  return statements.length;
}

try {
  const schemaStatements = await runFile("schema.sql");
  const seedStatements = await runFile("seed.sql");
  await pool.end();
  console.log(JSON.stringify({
    ok: true,
    schemaStatements,
    seedStatements,
  }, null, 2));
} catch (error) {
  await pool.end();
  console.error(error);
  process.exit(1);
}
