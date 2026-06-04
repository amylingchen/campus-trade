import { Router } from "express";
import { query } from "../config/db.js";
import { asyncHandler, ApiError } from "../middleware/errors.js";
import { toProduct } from "../utils/formatters.js";

export const usersRouter = Router();

usersRouter.get("/:id/profile", asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT u.id,
      u.school_id,
      u.name,
      u.avatar_url,
      u.major,
      u.bio,
      u.verified_student,
      u.created_at,
      s.short_name AS school_short_name,
      (SELECT COUNT(*) FROM products p WHERE p.seller_id = u.id AND p.status IN ('available', 'pending')) AS active_listing_count,
      (SELECT COUNT(*) FROM products p WHERE p.seller_id = u.id AND p.status = 'sold') AS sold_listing_count
     FROM users u
     JOIN schools s ON s.id = u.school_id
     WHERE u.id = :id
     LIMIT 1`,
    { id: req.params.id }
  );
  if (!rows[0]) throw new ApiError(404, "NOT_FOUND", "User profile not found.");
  const row = rows[0];
  res.json({
    data: {
      id: row.id,
      schoolId: row.school_id,
      name: row.name,
      avatarUrl: row.avatar_url,
      major: row.major,
      bio: row.bio,
      verifiedStudent: Boolean(row.verified_student),
      schoolShortName: row.school_short_name,
      joinedAt: row.created_at,
      stats: {
        activeListingCount: Number(row.active_listing_count),
        soldListingCount: Number(row.sold_listing_count),
      },
    },
  });
}));

usersRouter.get("/:id/products", asyncHandler(async (req, res) => {
  const statuses = String(req.query.status ?? "available,pending")
    .split(",")
    .map((status) => status.trim())
    .filter(Boolean);
  const allowedStatuses = ["available", "pending", "sold", "removed"];
  const safeStatuses = statuses.filter((status) => allowedStatuses.includes(status));
  const where = ["p.seller_id = :sellerId"];
  const params = { sellerId: req.params.id };
  if (req.query.schoolId) {
    where.push("p.school_id = :schoolId");
    params.schoolId = req.query.schoolId;
  }
  if (safeStatuses.length) {
    where.push(`p.status IN (${safeStatuses.map((_, index) => `:status${index}`).join(", ")})`);
    safeStatuses.forEach((status, index) => {
      params[`status${index}`] = status;
    });
  }
  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));
  const offset = (page - 1) * pageSize;
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const rows = await query(
    `SELECT p.*,
      u.name AS seller_name,
      u.verified_student AS seller_verified_student,
      s.short_name AS school_short_name,
      (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS image_url,
      (SELECT GROUP_CONCAT(c.course_code ORDER BY c.course_code SEPARATOR ',') FROM product_courses pc JOIN courses c ON c.id = pc.course_id WHERE pc.product_id = p.id) AS course_codes
     FROM products p
     JOIN users u ON u.id = p.seller_id
     JOIN schools s ON s.id = p.school_id
     ${whereSql}
     ORDER BY p.created_at DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params
  );
  const totalRows = await query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  res.json({ data: rows.map(toProduct), pagination: { page, pageSize, total: Number(totalRows[0].total) } });
}));
