import { query } from "../config/db.js";
import { ApiError } from "../middleware/errors.js";
import { newId } from "../utils/ids.js";

function toConversation(row) {
  return {
    id: row.id,
    productId: row.product_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    lastMessageAt: row.last_message_at,
    unreadCount: Number(row.unread_count ?? 0),
    product: {
      id: row.product_id,
      title: row.product_title,
      price: Number(row.product_price),
      status: row.product_status,
      imageUrl: row.product_image_url,
    },
    otherUser: {
      id: row.other_user_id,
      name: row.other_user_name,
      avatarUrl: row.other_user_avatar_url,
      schoolShortName: row.other_user_school_short_name,
      verifiedStudent: Boolean(row.other_user_verified_student),
    },
    lastMessage: row.last_message_id ? {
      id: row.last_message_id,
      content: row.last_message_content,
      createdAt: row.last_message_created_at,
    } : null,
  };
}

function toMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    readAt: row.read_at,
    createdAt: row.created_at,
    sender: row.sender_name ? {
      id: row.sender_id,
      name: row.sender_name,
      avatarUrl: row.sender_avatar_url,
    } : undefined,
  };
}

const conversationSelect = `
  SELECT c.*,
    p.title AS product_title,
    p.price AS product_price,
    p.status AS product_status,
    (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS product_image_url,
    other_user.id AS other_user_id,
    other_user.name AS other_user_name,
    other_user.avatar_url AS other_user_avatar_url,
    other_school.short_name AS other_user_school_short_name,
    other_user.verified_student AS other_user_verified_student,
    last_message.id AS last_message_id,
    last_message.content AS last_message_content,
    last_message.created_at AS last_message_created_at,
    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id <> :userId AND m.read_at IS NULL) AS unread_count
   FROM conversations c
   JOIN products p ON p.id = c.product_id
   JOIN users other_user ON other_user.id = IF(c.buyer_id = :userId, c.seller_id, c.buyer_id)
   JOIN schools other_school ON other_school.id = other_user.school_id
   LEFT JOIN messages last_message ON last_message.id = (
     SELECT m2.id FROM messages m2 WHERE m2.conversation_id = c.id ORDER BY m2.created_at DESC LIMIT 1
   )
`;

export async function listConversationsForUser(userId) {
  const rows = await query(
    `${conversationSelect}
     WHERE c.buyer_id = :userId OR c.seller_id = :userId
     ORDER BY c.last_message_at DESC, c.created_at DESC`,
    { userId }
  );
  return rows.map(toConversation);
}

export async function getConversationForUser(conversationId, userId) {
  const rows = await query(
    `${conversationSelect}
     WHERE c.id = :conversationId AND (c.buyer_id = :userId OR c.seller_id = :userId)
     LIMIT 1`,
    { conversationId, userId }
  );
  if (!rows[0]) throw new ApiError(403, "FORBIDDEN", "You are not a participant in this conversation.");
  return toConversation(rows[0]);
}

export async function startConversationForProduct(productId, buyerId) {
  const products = await query("SELECT id, seller_id FROM products WHERE id = :productId AND status IN ('available', 'pending')", { productId });
  if (!products[0]) throw new ApiError(404, "NOT_FOUND", "Product not found or unavailable.");
  if (products[0].seller_id === buyerId) throw new ApiError(409, "OWN_PRODUCT", "You cannot start a conversation for your own listing.");

  const existing = await query("SELECT id FROM conversations WHERE product_id = :productId AND buyer_id = :buyerId AND seller_id = :sellerId", {
    productId,
    buyerId,
    sellerId: products[0].seller_id,
  });
  if (existing[0]) return { id: existing[0].id, created: false };

  const id = newId("conversation");
  await query(
    `INSERT INTO conversations (id, product_id, buyer_id, seller_id, created_at, updated_at)
     VALUES (:id, :productId, :buyerId, :sellerId, NOW(), NOW())`,
    { id, productId, buyerId, sellerId: products[0].seller_id }
  );
  return { id, created: true };
}

export async function requireParticipant(conversationId, userId) {
  const rows = await query("SELECT id, buyer_id, seller_id FROM conversations WHERE id = :conversationId AND (buyer_id = :userId OR seller_id = :userId)", {
    conversationId,
    userId,
  });
  if (!rows[0]) throw new ApiError(403, "FORBIDDEN", "You are not a participant in this conversation.");
  return rows[0];
}

export async function listMessagesForUser(conversationId, userId, options = {}) {
  await requireParticipant(conversationId, userId);
  const where = ["m.conversation_id = :conversationId"];
  const params = { conversationId };
  if (options.beforeMessageId) {
    where.push("m.created_at < (SELECT created_at FROM messages WHERE id = :beforeMessageId)");
    params.beforeMessageId = options.beforeMessageId;
  }
  if (options.afterMessageId) {
    where.push("m.created_at > (SELECT created_at FROM messages WHERE id = :afterMessageId)");
    params.afterMessageId = options.afterMessageId;
  }
  const pageSize = Math.min(100, Math.max(1, Number(options.pageSize ?? 50)));
  const rows = await query(
    `SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar_url
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE ${where.join(" AND ")}
     ORDER BY m.created_at ASC
     LIMIT ${pageSize}`,
    params
  );
  return rows.map(toMessage);
}

export async function createMessageForUser(conversationId, user, content) {
  const trimmed = String(content ?? "").trim();
  if (!trimmed) throw new ApiError(400, "VALIDATION_ERROR", "Message content is required.");
  await requireParticipant(conversationId, user.id);
  const id = newId("message");
  await query(
    "INSERT INTO messages (id, conversation_id, sender_id, content, created_at) VALUES (:id, :conversationId, :senderId, :content, NOW())",
    { id, conversationId, senderId: user.id, content: trimmed }
  );
  await query("UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = :id", { id: conversationId });
  const rows = await query(
    `SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar_url
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.id = :id`,
    { id }
  );
  return toMessage(rows[0]);
}

export async function markConversationReadForUser(conversationId, userId, readUntilMessageId = null) {
  await requireParticipant(conversationId, userId);
  const params = { conversationId, userId };
  let createdAtClause = "";
  if (readUntilMessageId) {
    const rows = await query(
      "SELECT created_at FROM messages WHERE id = :readUntilMessageId AND conversation_id = :conversationId LIMIT 1",
      { readUntilMessageId, conversationId }
    );
    if (rows[0]) {
      createdAtClause = "AND created_at <= :readUntilCreatedAt";
      params.readUntilCreatedAt = rows[0].created_at;
    }
  }
  await query(
    `UPDATE messages
     SET read_at = NOW()
     WHERE conversation_id = :conversationId
       AND sender_id <> :userId
       AND read_at IS NULL
       ${createdAtClause}`,
    params
  );
  return { id: conversationId, read: true };
}
