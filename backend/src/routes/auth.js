import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { authenticate, signToken } from "../middleware/auth.js";
import { ApiError, asyncHandler } from "../middleware/errors.js";
import { newId } from "../utils/ids.js";
import { requireFields } from "../utils/validation.js";

export const authRouter = Router();

function toAuthUser(row) {
  return {
    id: row.id,
    schoolId: row.school_id,
    name: row.name,
    email: row.email,
    major: row.major,
    avatarUrl: row.avatar_url,
    verifiedStudent: Boolean(row.verified_student),
    verificationStatus: row.verification_status,
  };
}

authRouter.post("/register", asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "email", "password", "schoolId"]);
  const { name, email, password, schoolId } = req.body;
  const schools = await query("SELECT * FROM schools WHERE id = :schoolId AND is_active = 1", { schoolId });
  if (!schools[0]) throw new ApiError(400, "VALIDATION_ERROR", "Active school is required.");
  if (!String(email).toLowerCase().endsWith(`@${schools[0].email_domain}`)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Email must match the selected school domain.");
  }

  const existing = await query("SELECT id FROM users WHERE email = :email", { email });
  if (existing[0]) throw new ApiError(409, "EMAIL_EXISTS", "An account with this email already exists.");

  const id = newId("user");
  const passwordHash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users (id, school_id, name, email, password_hash, verified_student, verification_status, created_at, updated_at)
     VALUES (:id, :schoolId, :name, :email, :passwordHash, 0, 'pending', NOW(), NOW())`,
    { id, schoolId, name, email, passwordHash }
  );
  const rows = await query("SELECT * FROM users WHERE id = :id", { id });
  res.status(201).json({ data: { token: signToken(id), user: toAuthUser(rows[0]) } });
}));

authRouter.post("/login", asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);
  const rows = await query("SELECT * FROM users WHERE email = :email", { email: req.body.email });
  if (!rows[0]) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  const valid = await bcrypt.compare(req.body.password, rows[0].password_hash);
  if (!valid) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  res.json({ data: { token: signToken(rows[0].id), user: toAuthUser(rows[0]) } });
}));

authRouter.get("/me", authenticate, asyncHandler(async (req, res) => {
  res.json({ data: req.user });
}));

authRouter.post("/logout", authenticate, asyncHandler(async (_req, res) => {
  res.status(204).send();
}));
