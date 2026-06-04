import { Router } from "express";
import { query } from "../config/db.js";
import { asyncHandler } from "../middleware/errors.js";
import { normalizeCourseCode, toProduct } from "../utils/formatters.js";

export const coursesRouter = Router();

coursesRouter.get("/", asyncHandler(async (req, res) => {
  const where = [];
  const params = {};
  if (req.query.schoolId) {
    where.push("school_id = :schoolId");
    params.schoolId = req.query.schoolId;
  }
  if (req.query.q) {
    where.push("(course_code LIKE :q OR course_name LIKE :q OR normalized_course_code LIKE :normalized)");
    params.q = `%${req.query.q}%`;
    params.normalized = `%${normalizeCourseCode(req.query.q)}%`;
  }
  const rows = await query(
    `SELECT id, school_id, course_code, course_name, department FROM courses ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY course_code ASC`,
    params
  );
  res.json({
    data: rows.map((row) => ({
      id: row.id,
      schoolId: row.school_id,
      courseCode: row.course_code,
      courseName: row.course_name,
      department: row.department,
    })),
  });
}));

coursesRouter.get("/:courseCode/products", asyncHandler(async (req, res) => {
  const normalized = normalizeCourseCode(req.params.courseCode);
  const rows = await query(
    `SELECT p.*,
      u.name AS seller_name,
      u.verified_student AS seller_verified_student,
      s.short_name AS school_short_name,
      (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS image_url,
      (SELECT GROUP_CONCAT(c2.course_code ORDER BY c2.course_code SEPARATOR ',') FROM product_courses pc2 JOIN courses c2 ON c2.id = pc2.course_id WHERE pc2.product_id = p.id) AS course_codes
     FROM product_courses pc
     JOIN courses c ON c.id = pc.course_id
     JOIN products p ON p.id = pc.product_id
     JOIN users u ON u.id = p.seller_id
     JOIN schools s ON s.id = p.school_id
     WHERE c.normalized_course_code = :normalized
     ORDER BY p.created_at DESC`,
    { normalized }
  );
  res.json({ data: rows.map(toProduct), pagination: { page: 1, pageSize: rows.length, total: rows.length } });
}));
