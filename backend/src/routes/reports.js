import { Router } from "express";
import { query } from "../config/db.js";
import { authenticate, requireVerified } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";
import { newId } from "../utils/ids.js";
import { requireFields } from "../utils/validation.js";

export const reportsRouter = Router();

reportsRouter.post("/", authenticate, requireVerified, asyncHandler(async (req, res) => {
  requireFields(req.body, ["reason"]);
  const id = newId("report");
  await query(
    `INSERT INTO reports (id, reporter_id, product_id, reported_user_id, reason, detail, status, created_at)
     VALUES (:id, :reporterId, :productId, :reportedUserId, :reason, :detail, 'open', NOW())`,
    {
      id,
      reporterId: req.user.id,
      productId: req.body.productId ?? null,
      reportedUserId: req.body.reportedUserId ?? null,
      reason: req.body.reason,
      detail: req.body.detail ?? null,
    }
  );
  res.status(201).json({ data: { id, status: "open" } });
}));
