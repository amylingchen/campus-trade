import { Router } from "express";
import { query } from "../config/db.js";
import { authenticate, requireVerified } from "../middleware/auth.js";
import { ApiError, asyncHandler } from "../middleware/errors.js";
import { toProduct } from "../utils/formatters.js";

export const favoritesRouter = Router();

const favoriteProductSelect = `
  SELECT p.*,
    u.name AS seller_name,
    u.verified_student AS seller_verified_student,
    s.short_name AS school_short_name,
    (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS image_url,
    (SELECT GROUP_CONCAT(c.course_code ORDER BY c.course_code SEPARATOR ',') FROM product_courses pc JOIN courses c ON c.id = pc.course_id WHERE pc.product_id = p.id) AS course_codes
  FROM favorites f
  JOIN products p ON p.id = f.product_id
  JOIN users u ON u.id = p.seller_id
  JOIN schools s ON s.id = p.school_id
`;

favoritesRouter.get("/", authenticate, requireVerified, asyncHandler(async (req, res) => {
  const rows = await query(`${favoriteProductSelect} WHERE f.user_id = :userId ORDER BY f.created_at DESC`, { userId: req.user.id });
  res.json({ data: rows.map((row) => ({ ...toProduct(row), isFavorited: true })) });
}));

favoritesRouter.post("/:productId", authenticate, requireVerified, asyncHandler(async (req, res) => {
  const products = await query("SELECT id FROM products WHERE id = :productId", { productId: req.params.productId });
  if (!products[0]) throw new ApiError(404, "NOT_FOUND", "Product not found.");
  await query("INSERT IGNORE INTO favorites (user_id, product_id, created_at) VALUES (:userId, :productId, NOW())", {
    userId: req.user.id,
    productId: req.params.productId,
  });
  res.status(201).json({ data: { productId: req.params.productId } });
}));

favoritesRouter.delete("/:productId", authenticate, requireVerified, asyncHandler(async (req, res) => {
  await query("DELETE FROM favorites WHERE user_id = :userId AND product_id = :productId", {
    userId: req.user.id,
    productId: req.params.productId,
  });
  res.status(204).send();
}));
