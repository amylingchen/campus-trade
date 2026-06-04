import { ApiError } from "../middleware/errors.js";

export function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
  if (missing.length > 0) {
    throw new ApiError(400, "VALIDATION_ERROR", `${missing[0]} is required.`, missing.map((field) => ({ field, message: "Required" })));
  }
}

export function assertEnum(value, allowed, field) {
  if (value !== undefined && !allowed.includes(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} is invalid.`, [{ field, message: `Allowed values: ${allowed.join(", ")}` }]);
  }
}
