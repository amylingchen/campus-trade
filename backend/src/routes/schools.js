import { Router } from "express";
import { query } from "../config/db.js";
import { asyncHandler, ApiError } from "../middleware/errors.js";
import { toSchool } from "../utils/formatters.js";

export const schoolsRouter = Router();

schoolsRouter.get("/", asyncHandler(async (_req, res) => {
  const rows = await query("SELECT * FROM schools ORDER BY is_active DESC, name ASC");
  res.json({ data: rows.map(toSchool) });
}));

schoolsRouter.get("/:id", asyncHandler(async (req, res) => {
  const rows = await query("SELECT * FROM schools WHERE id = :id", { id: req.params.id });
  if (!rows[0]) throw new ApiError(404, "NOT_FOUND", "School not found.");
  res.json({ data: toSchool(rows[0]) });
}));
