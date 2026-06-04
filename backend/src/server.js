import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { authRouter } from "./routes/auth.js";
import { conversationsRouter } from "./routes/conversations.js";
import { coursesRouter } from "./routes/courses.js";
import { favoritesRouter } from "./routes/favorites.js";
import { productsRouter } from "./routes/products.js";
import { reportsRouter } from "./routes/reports.js";
import { schoolsRouter } from "./routes/schools.js";
import { uploadsRouter } from "./routes/uploads.js";
import { usersRouter } from "./routes/users.js";
import { verificationRouter } from "./routes/verification.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { attachChatSocket } from "./realtime/chatSocket.js";
import { isOriginAllowed } from "./config/origin.js";

const app = express();
const port = process.env.PORT ?? 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsPath = path.resolve(__dirname, "../uploads");

app.use(cors({
  origin(origin, callback) {
    callback(null, isOriginAllowed(origin));
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsPath));

app.get("/api/health", (_req, res) => {
  res.json({ data: { ok: true, service: "campus-trade-api" } });
});

app.use("/api/schools", schoolsRouter);
app.use("/api/auth", authRouter);
app.use("/api/verification", verificationRouter);
app.use("/api/products", productsRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/users", usersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = http.createServer(app);
attachChatSocket(server);

server.listen(port, () => {
  console.log(`Campus Trade API listening on http://localhost:${port}/api`);
});
