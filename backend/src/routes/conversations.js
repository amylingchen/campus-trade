import { Router } from "express";
import { authenticate, requireVerified } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";
import {
  createMessageForUser,
  getConversationForUser,
  listConversationsForUser,
  listMessagesForUser,
  markConversationReadForUser,
  startConversationForProduct,
} from "../services/conversationService.js";
import { requireFields } from "../utils/validation.js";

export const conversationsRouter = Router();

conversationsRouter.get("/", authenticate, requireVerified, asyncHandler(async (req, res) => {
  res.json({ data: await listConversationsForUser(req.user.id) });
}));

conversationsRouter.post("/", authenticate, requireVerified, asyncHandler(async (req, res) => {
  requireFields(req.body, ["productId"]);
  const result = await startConversationForProduct(req.body.productId, req.user.id);
  res.status(result.created ? 201 : 200).json({ data: { id: result.id } });
}));

conversationsRouter.get("/:id", authenticate, requireVerified, asyncHandler(async (req, res) => {
  res.json({ data: await getConversationForUser(req.params.id, req.user.id) });
}));

conversationsRouter.get("/:id/messages", authenticate, requireVerified, asyncHandler(async (req, res) => {
  const messages = await listMessagesForUser(req.params.id, req.user.id, req.query);
  res.json({ data: messages });
}));

conversationsRouter.post("/:id/messages", authenticate, requireVerified, asyncHandler(async (req, res) => {
  requireFields(req.body, ["content"]);
  res.status(201).json({ data: await createMessageForUser(req.params.id, req.user, req.body.content) });
}));

conversationsRouter.patch("/:id/read", authenticate, requireVerified, asyncHandler(async (req, res) => {
  const result = await markConversationReadForUser(req.params.id, req.user.id, req.body?.readUntilMessageId);
  res.json({ data: result });
}));
