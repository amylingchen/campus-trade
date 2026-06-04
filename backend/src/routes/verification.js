import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { authenticate } from "../middleware/auth.js";
import { ApiError, asyncHandler } from "../middleware/errors.js";
import { newId } from "../utils/ids.js";
import { requireFields } from "../utils/validation.js";

export const verificationRouter = Router();

verificationRouter.post("/send-code", authenticate, asyncHandler(async (req, res) => {
  requireFields(req.body, ["email"]);
  const schools = await query("SELECT * FROM schools WHERE id = :schoolId", { schoolId: req.user.schoolId });
  const domain = schools[0]?.email_domain;
  if (!domain || !String(req.body.email).toLowerCase().endsWith(`@${domain}`)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Email must match your school domain.");
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);
  const id = newId("verify");
  await query(
    `INSERT INTO email_verifications (id, user_id, email, code_hash, expires_at, created_at)
     VALUES (:id, :userId, :email, :codeHash, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW())`,
    { id, userId: req.user.id, email: req.body.email, codeHash }
  );
  console.log(`School verification code for ${req.body.email}: ${code}`);
  res.json({
    data: {
      sent: true,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      devCode: process.env.NODE_ENV === "production" ? undefined : code,
    },
  });
}));

verificationRouter.post("/confirm-code", authenticate, asyncHandler(async (req, res) => {
  requireFields(req.body, ["code"]);
  const rows = await query(
    `SELECT * FROM email_verifications
     WHERE user_id = :userId AND verified_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    { userId: req.user.id }
  );
  if (!rows[0]) throw new ApiError(400, "INVALID_CODE", "No active verification code found.");
  const valid = await bcrypt.compare(req.body.code, rows[0].code_hash);
  if (!valid) throw new ApiError(400, "INVALID_CODE", "Verification code is invalid.");

  await query("UPDATE email_verifications SET verified_at = NOW() WHERE id = :id", { id: rows[0].id });
  await query("UPDATE users SET verified_student = 1, verification_status = 'verified', updated_at = NOW() WHERE id = :userId", { userId: req.user.id });
  res.json({ data: { verifiedStudent: true, verificationStatus: "verified" } });
}));
