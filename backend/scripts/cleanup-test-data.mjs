import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const envPath = path.resolve(process.cwd(), ".env");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

const fileEnv = loadEnvFile(envPath);
const config = {
  host: process.env.DB_HOST ?? fileEnv.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? fileEnv.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? fileEnv.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? fileEnv.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? fileEnv.DB_NAME ?? "campus_trade",
};

const productTitlePatterns = [
  "Playwright Pi%",
  "Auto Pi Kit%",
  "E2E%",
  "Full Flow%",
  "Cleanup Flow%",
  "Socket Pi%",
];

const userEmailPatterns = [
  "autotest-%@mavs.uta.edu",
  "playwright-%@mavs.uta.edu",
  "e2e-%@mavs.uta.edu",
  "fullflow-%@mavs.uta.edu",
  "socket-%@mavs.uta.edu",
];

function likeClause(column, values) {
  return values.map(() => `${column} LIKE ?`).join(" OR ");
}

async function selectIds(connection, sql, params) {
  const [rows] = await connection.query(sql, params);
  return rows.map((row) => row.id);
}

async function deleteIn(connection, table, column, ids) {
  if (ids.length === 0) return 0;
  const [result] = await connection.query(
    `DELETE FROM ${table} WHERE ${column} IN (?)`,
    [ids]
  );
  return result.affectedRows ?? 0;
}

const connection = await mysql.createConnection(config);

try {
  await connection.beginTransaction();

  const testUserIds = await selectIds(
    connection,
    `SELECT id FROM users WHERE ${likeClause("email", userEmailPatterns)}`,
    userEmailPatterns
  );

  const productIds = await selectIds(
    connection,
    `SELECT id FROM products WHERE ${likeClause("title", productTitlePatterns)}${testUserIds.length ? " OR seller_id IN (?)" : ""}`,
    testUserIds.length ? [...productTitlePatterns, testUserIds] : productTitlePatterns
  );

  const conversationIds = await selectIds(
    connection,
    `SELECT id FROM conversations WHERE ${productIds.length ? "product_id IN (?)" : "1 = 0"}${testUserIds.length ? " OR buyer_id IN (?) OR seller_id IN (?)" : ""}`,
    [
      ...(productIds.length ? [productIds] : []),
      ...(testUserIds.length ? [testUserIds, testUserIds] : []),
    ]
  );

  const counts = {};
  counts.messages = await deleteIn(connection, "messages", "conversation_id", conversationIds);

  if (productIds.length || testUserIds.length) {
    const [reportsResult] = await connection.query(
      `DELETE FROM reports WHERE ${productIds.length ? "product_id IN (?)" : "1 = 0"}${testUserIds.length ? " OR reporter_id IN (?) OR reported_user_id IN (?)" : ""}`,
      [
        ...(productIds.length ? [productIds] : []),
        ...(testUserIds.length ? [testUserIds, testUserIds] : []),
      ]
    );
    counts.reports = reportsResult.affectedRows ?? 0;
  } else {
    counts.reports = 0;
  }

  counts.conversations = await deleteIn(connection, "conversations", "id", conversationIds);
  counts.favorites = await deleteIn(connection, "favorites", "product_id", productIds);
  counts.productCourses = await deleteIn(connection, "product_courses", "product_id", productIds);
  counts.productImages = await deleteIn(connection, "product_images", "product_id", productIds);
  counts.products = await deleteIn(connection, "products", "id", productIds);
  counts.emailVerifications = await deleteIn(connection, "email_verifications", "user_id", testUserIds);
  counts.users = await deleteIn(connection, "users", "id", testUserIds);

  await connection.commit();
  console.log(JSON.stringify({ ok: true, counts }, null, 2));
} catch (error) {
  await connection.rollback();
  console.error(error);
  process.exitCode = 1;
} finally {
  await connection.end();
}
