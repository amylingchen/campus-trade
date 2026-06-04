import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { ApiError, asyncHandler } from "./errors.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "UNAUTHENTICATED", "Authentication required.");

  try {
    req.user = await getUserFromToken(token);
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "UNAUTHENTICATED", "Invalid or expired token.");
  }
});

export function requireVerified(req, _res, next) {
  if (!req.user?.verifiedStudent) {
    throw new ApiError(403, "SCHOOL_VERIFICATION_REQUIRED", "School email verification required.");
  }
  next();
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? "dev-secret", { expiresIn: "7d" });
}

export async function getUserFromToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET ?? "dev-secret");
  const users = await query(
    `SELECT id, school_id, name, email, avatar_url, major, bio, verified_student, verification_status, created_at, updated_at
     FROM users WHERE id = :id`,
    { id: payload.sub }
  );
  if (!users[0]) throw new ApiError(401, "UNAUTHENTICATED", "User not found.");
  return toUser(users[0]);
}

export function toUser(row) {
  return {
    id: row.id,
    schoolId: row.school_id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    major: row.major,
    bio: row.bio,
    verifiedStudent: Boolean(row.verified_student),
    verificationStatus: row.verification_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
