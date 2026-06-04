export function parseAllowedOrigins(value) {
  return String(value ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin, allowedOrigins = parseAllowedOrigins(process.env.FRONTEND_ORIGIN)) {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}
