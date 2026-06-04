import { Router } from "express";
import { query, transaction } from "../config/db.js";
import { authenticate, requireVerified } from "../middleware/auth.js";
import { ApiError, asyncHandler } from "../middleware/errors.js";
import { displayCourseCode, normalizeCourseCode, toProduct } from "../utils/formatters.js";
import { newId } from "../utils/ids.js";
import { assertEnum, requireFields } from "../utils/validation.js";

export const productsRouter = Router();

const categories = ["course_materials", "electronics", "books", "furniture", "dorm_home", "clothing", "transportation", "sports_outdoor", "tickets_events", "free_stuff", "other"];
const usageTypes = ["course_required", "course_recommended", "personal_sale", "moving_sale", "free"];
const conditions = ["new", "like_new", "good", "fair", "poor"];
const statuses = ["available", "pending", "sold", "removed"];

function productSelect(extra = "") {
  return `
    SELECT p.*,
      u.name AS seller_name,
      u.verified_student AS seller_verified_student,
      s.short_name AS school_short_name,
      (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS image_url,
      (SELECT GROUP_CONCAT(c.course_code ORDER BY c.course_code SEPARATOR ',') FROM product_courses pc JOIN courses c ON c.id = pc.course_id WHERE pc.product_id = p.id) AS course_codes
      ${extra}
    FROM products p
    JOIN users u ON u.id = p.seller_id
    JOIN schools s ON s.id = p.school_id
  `;
}

function validateProductPayload(body, partial = false) {
  if (!partial) requireFields(body, ["title", "description", "price", "category", "condition", "location"]);
  assertEnum(body.category, categories, "category");
  assertEnum(body.usageType, usageTypes, "usageType");
  assertEnum(body.condition, conditions, "condition");
  if (body.price !== undefined && Number(body.price) < 0) throw new ApiError(400, "VALIDATION_ERROR", "price must be greater than or equal to 0.");
}

async function attachCourses(connection, productId, schoolId, courseCodes = []) {
  for (const code of courseCodes) {
    const normalized = normalizeCourseCode(code);
    if (!normalized) continue;
    const display = displayCourseCode(code);
    const proposedCourseId = `course_${schoolId}_${normalized}`.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    await connection.execute(
      `INSERT INTO courses (id, school_id, course_code, normalized_course_code, department, created_at)
       VALUES (:courseId, :schoolId, :display, :normalized, :department, NOW())
       ON DUPLICATE KEY UPDATE course_code = VALUES(course_code)`,
      { courseId: proposedCourseId, schoolId, display, normalized, department: display.split(" ")[0] ?? null }
    );
    const [courses] = await connection.execute(
      "SELECT id FROM courses WHERE school_id = :schoolId AND normalized_course_code = :normalized LIMIT 1",
      { schoolId, normalized }
    );
    const courseId = courses[0].id;
    await connection.execute(
      "INSERT IGNORE INTO product_courses (product_id, course_id) VALUES (:productId, :courseId)",
      { productId, courseId }
    );
  }
}

productsRouter.get("/", asyncHandler(async (req, res) => {
  const where = [];
  const params = {};
  if (req.query.schoolId) {
    where.push("p.school_id = :schoolId");
    params.schoolId = req.query.schoolId;
  }
  if (req.query.sellerId) {
    where.push("p.seller_id = :sellerId");
    params.sellerId = req.query.sellerId;
  }
  if (req.query.q) {
    where.push("(p.title LIKE :q OR p.description LIKE :q)");
    params.q = `%${req.query.q}%`;
  }
  for (const key of ["category", "status"]) {
    if (req.query[key]) {
      where.push(`p.${key} = :${key}`);
      params[key] = req.query[key];
    }
  }
  if (req.query.usageType) {
    where.push("p.usage_type = :usageType");
    params.usageType = req.query.usageType;
  }
  if (req.query.condition) {
    where.push("p.condition_value = :condition");
    params.condition = req.query.condition;
  }
  if (req.query.minPrice) {
    where.push("p.price >= :minPrice");
    params.minPrice = Number(req.query.minPrice);
  }
  if (req.query.maxPrice) {
    where.push("p.price <= :maxPrice");
    params.maxPrice = Number(req.query.maxPrice);
  }
  if (req.query.courseCode) {
    where.push(`EXISTS (
      SELECT 1 FROM product_courses pc
      JOIN courses c ON c.id = pc.course_id
      WHERE pc.product_id = p.id AND c.normalized_course_code LIKE :courseCode
    )`);
    params.courseCode = `%${normalizeCourseCode(req.query.courseCode)}%`;
  }
  const order = req.query.sort === "price_asc" ? "p.price ASC" : req.query.sort === "price_desc" ? "p.price DESC" : "p.created_at DESC";
  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));
  const offset = (page - 1) * pageSize;
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = await query(`${productSelect()} ${whereSql} ORDER BY ${order} LIMIT ${pageSize} OFFSET ${offset}`, params);
  const totalRows = await query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  res.json({ data: rows.map(toProduct), pagination: { page, pageSize, total: Number(totalRows[0].total) } });
}));

productsRouter.post("/", authenticate, requireVerified, asyncHandler(async (req, res) => {
  validateProductPayload(req.body);
  const id = newId("listing");
  await transaction(async (connection) => {
    await connection.execute(
      `INSERT INTO products (id, school_id, seller_id, title, description, price, category, usage_type, condition_value, status, location, negotiable, is_course_related, created_at, updated_at)
       VALUES (:id, :schoolId, :sellerId, :title, :description, :price, :category, :usageType, :conditionValue, 'available', :location, :negotiable, :isCourseRelated, NOW(), NOW())`,
      {
        id,
        schoolId: req.user.schoolId,
        sellerId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        price: Number(req.body.price),
        category: req.body.category,
        usageType: req.body.usageType ?? "personal_sale",
        conditionValue: req.body.condition,
        location: req.body.location,
        negotiable: Boolean(req.body.negotiable),
        isCourseRelated: Boolean(req.body.isCourseRelated),
      }
    );
    for (const [index, image] of (req.body.images ?? []).entries()) {
      await connection.execute(
        "INSERT INTO product_images (id, product_id, image_url, sort_order, created_at) VALUES (:id, :productId, :imageUrl, :sortOrder, NOW())",
        { id: newId("image"), productId: id, imageUrl: image.imageUrl, sortOrder: image.sortOrder ?? index + 1 }
      );
    }
    await attachCourses(connection, id, req.user.schoolId, req.body.courseCodes ?? []);
  });
  res.status(201).json({ data: { id } });
}));

productsRouter.get("/:id", asyncHandler(async (req, res) => {
  const rows = await query(`${productSelect()} WHERE p.id = :id`, { id: req.params.id });
  if (!rows[0]) throw new ApiError(404, "NOT_FOUND", "Product not found.");
  const images = await query("SELECT id, image_url AS imageUrl, sort_order AS sortOrder FROM product_images WHERE product_id = :id ORDER BY sort_order ASC", { id: req.params.id });
  res.json({ data: { ...toProduct(rows[0]), images } });
}));

productsRouter.patch("/:id", authenticate, requireVerified, asyncHandler(async (req, res) => {
  validateProductPayload(req.body, true);
  const rows = await query("SELECT * FROM products WHERE id = :id", { id: req.params.id });
  if (!rows[0]) throw new ApiError(404, "NOT_FOUND", "Product not found.");
  if (rows[0].seller_id !== req.user.id) throw new ApiError(403, "FORBIDDEN", "Only the seller can edit this product.");

  await query(
    `UPDATE products SET
      title = COALESCE(:title, title),
      description = COALESCE(:description, description),
      price = COALESCE(:price, price),
      category = COALESCE(:category, category),
      usage_type = COALESCE(:usageType, usage_type),
      condition_value = COALESCE(:conditionValue, condition_value),
      location = COALESCE(:location, location),
      negotiable = COALESCE(:negotiable, negotiable),
      is_course_related = COALESCE(:isCourseRelated, is_course_related),
      updated_at = NOW()
     WHERE id = :id`,
    {
      id: req.params.id,
      title: req.body.title ?? null,
      description: req.body.description ?? null,
      price: req.body.price === undefined ? null : Number(req.body.price),
      category: req.body.category ?? null,
      usageType: req.body.usageType ?? null,
      conditionValue: req.body.condition ?? null,
      location: req.body.location ?? null,
      negotiable: req.body.negotiable === undefined ? null : Boolean(req.body.negotiable),
      isCourseRelated: req.body.isCourseRelated === undefined ? null : Boolean(req.body.isCourseRelated),
    }
  );
  res.json({ data: { id: req.params.id } });
}));

productsRouter.patch("/:id/status", authenticate, requireVerified, asyncHandler(async (req, res) => {
  requireFields(req.body, ["status"]);
  assertEnum(req.body.status, statuses, "status");
  const rows = await query("SELECT seller_id FROM products WHERE id = :id", { id: req.params.id });
  if (!rows[0]) throw new ApiError(404, "NOT_FOUND", "Product not found.");
  if (rows[0].seller_id !== req.user.id) throw new ApiError(403, "FORBIDDEN", "Only the seller can change status.");
  await query("UPDATE products SET status = :status, updated_at = NOW() WHERE id = :id", { id: req.params.id, status: req.body.status });
  res.json({ data: { id: req.params.id, status: req.body.status } });
}));

productsRouter.delete("/:id", authenticate, requireVerified, asyncHandler(async (req, res) => {
  const rows = await query("SELECT seller_id FROM products WHERE id = :id", { id: req.params.id });
  if (!rows[0]) throw new ApiError(404, "NOT_FOUND", "Product not found.");
  if (rows[0].seller_id !== req.user.id) throw new ApiError(403, "FORBIDDEN", "Only the seller can delete this product.");
  await query("DELETE FROM products WHERE id = :id", { id: req.params.id });
  res.status(204).send();
}));
