import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { authenticate, requireVerified } from "../middleware/auth.js";
import { ApiError } from "../middleware/errors.js";

export const uploadsRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = extensionFor(file.mimetype);
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new ApiError(400, "VALIDATION_ERROR", "Only JPG, PNG, WebP, and GIF images are allowed."));
      return;
    }
    cb(null, true);
  },
});

uploadsRouter.post("/", authenticate, requireVerified, (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      if (error instanceof ApiError) return next(error);
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(new ApiError(400, "VALIDATION_ERROR", "Image must be 5MB or smaller."));
      }
      return next(error);
    }

    if (!req.file) {
      return next(new ApiError(400, "VALIDATION_ERROR", "Image file is required."));
    }

    res.status(201).json({
      data: {
        imageUrl: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });
  });
});

function extensionFor(mimeType) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return ".jpg";
}
