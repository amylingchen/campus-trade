import { Server } from "socket.io";
import { getUserFromToken } from "../middleware/auth.js";
import {
  createMessageForUser,
  getConversationForUser,
  markConversationReadForUser,
} from "../services/conversationService.js";

function roomName(conversationId) {
  return `conversation:${conversationId}`;
}

function publicError(error) {
  return {
    code: error.code ?? "SOCKET_ERROR",
    message: error.message ?? "Real-time messaging error.",
  };
}

export function attachChatSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (!token) throw new Error("Authentication required.");
      const user = await getUserFromToken(token);
      if (!user.verifiedStudent) throw new Error("School email verification required.");
      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on("conversation:join", async (payload = {}, callback) => {
      try {
        const conversation = await getConversationForUser(payload.conversationId, socket.user.id);
        socket.join(roomName(conversation.id));
        callback?.({ ok: true, data: conversation });
      } catch (error) {
        const payloadError = publicError(error);
        callback?.({ ok: false, error: payloadError });
        socket.emit("message:error", { error: payloadError });
      }
    });

    socket.on("message:send", async (payload = {}, callback) => {
      const clientMessageId = payload.clientMessageId;
      try {
        const message = await createMessageForUser(payload.conversationId, socket.user, payload.content);
        const conversation = await getConversationForUser(payload.conversationId, socket.user.id);
        const ackPayload = { clientMessageId, message };
        callback?.({ ok: true, data: ackPayload });
        socket.emit("message:ack", ackPayload);
        io.to(roomName(payload.conversationId)).emit("message:new", {
          conversationId: payload.conversationId,
          message,
        });
        io.to(roomName(payload.conversationId)).emit("conversation:updated", {
          id: conversation.id,
          lastMessageAt: message.createdAt,
          unreadCount: conversation.unreadCount,
          lastMessage: {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
          },
        });
      } catch (error) {
        const payloadError = { clientMessageId, ...publicError(error) };
        callback?.({ ok: false, error: payloadError });
        socket.emit("message:error", payloadError);
      }
    });

    socket.on("message:read", async (payload = {}, callback) => {
      try {
        await markConversationReadForUser(payload.conversationId, socket.user.id, payload.readUntilMessageId);
        const event = {
          conversationId: payload.conversationId,
          readerId: socket.user.id,
          readUntilMessageId: payload.readUntilMessageId ?? null,
          readAt: new Date().toISOString(),
        };
        callback?.({ ok: true, data: event });
        io.to(roomName(payload.conversationId)).emit("message:read", event);
      } catch (error) {
        const payloadError = publicError(error);
        callback?.({ ok: false, error: payloadError });
        socket.emit("message:error", { error: payloadError });
      }
    });
  });

  return io;
}
