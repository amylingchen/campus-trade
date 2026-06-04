import fs from "node:fs/promises";
import path from "node:path";
import { io } from "socket.io-client";

const API = process.env.API_BASE_URL ?? "http://localhost:4000/api";
const SOCKET_URL = process.env.SOCKET_URL ?? "http://localhost:4000";
const results = [];

function record(id, scenario, result, owner, evidence) {
  results.push({ id, scenario, result, owner, evidence });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function jsonRequest(pathname, options = {}) {
  const response = await fetch(`${API}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(payload?.error?.message ?? `HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function once(socket, event, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function emitWithAck(socket, event, payload, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event} ack`)), timeoutMs);
    socket.emit(event, payload, (response) => {
      clearTimeout(timer);
      if (!response?.ok) reject(new Error(response?.error?.message ?? `${event} failed`));
      else resolve(response.data);
    });
  });
}

function connectSocket(token) {
  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: false,
  });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Socket connection timed out")), 8000);
    socket.once("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function runCase(id, scenario, owner, fn) {
  try {
    const evidence = await fn();
    record(id, scenario, "PASS", owner, evidence);
  } catch (error) {
    record(id, scenario, "FAIL", owner, `${error.message}${error.payload ? ` ${JSON.stringify(error.payload)}` : ""}`);
  }
}

await runCase("SOCKET-001", "Verified users exchange real-time messages and read events", "backend-api-builder", async () => {
  const unique = Date.now();
  const sellerEmail = `socket-seller-${unique}@mavs.uta.edu`;
  const sellerRegister = await jsonRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Socket Seller", email: sellerEmail, password: "password123", schoolId: "school_uta" }),
  });
  const sellerToken = sellerRegister.data.token;
  const sendCode = await jsonRequest("/verification/send-code", {
    method: "POST",
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ email: sellerEmail }),
  });
  await jsonRequest("/verification/confirm-code", {
    method: "POST",
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ code: sendCode.data.devCode }),
  });
  const buyerLogin = await jsonRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "maya@mavs.uta.edu", password: "password123" }),
  });
  const buyerToken = buyerLogin.data.token;

  const product = await jsonRequest("/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({
      title: `Socket Pi Kit ${unique}`,
      description: "Socket smoke test product.",
      price: 64,
      category: "course_materials",
      usageType: "course_required",
      condition: "good",
      location: "ERB",
      negotiable: true,
      isCourseRelated: true,
      courseCodes: ["CSE 3442"],
      images: [],
    }),
  });

  const conversation = await jsonRequest("/conversations", {
    method: "POST",
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ productId: product.data.id }),
  });

  const buyerSocket = await connectSocket(buyerToken);
  const sellerSocket = await connectSocket(sellerToken);
  try {
    await emitWithAck(buyerSocket, "conversation:join", { conversationId: conversation.data.id });
    await emitWithAck(sellerSocket, "conversation:join", { conversationId: conversation.data.id });
    const clientMessageId = `client_${unique}`;
    const sellerIncoming = once(sellerSocket, "message:new");
    const buyerRead = once(buyerSocket, "message:read");
    const ack = await emitWithAck(buyerSocket, "message:send", {
      conversationId: conversation.data.id,
      clientMessageId,
      content: `Real-time hello ${unique}`,
    });
    assert(ack.clientMessageId === clientMessageId, "ack did not preserve clientMessageId");
    assert(ack.message.id, "ack missing persisted message");
    const incoming = await sellerIncoming;
    assert(incoming.message.id === ack.message.id, "seller did not receive persisted message");
    await emitWithAck(sellerSocket, "message:read", {
      conversationId: conversation.data.id,
      readUntilMessageId: ack.message.id,
    });
    const readEvent = await buyerRead;
    assert(readEvent.readerId === sellerRegister.data.user.id, "read event reader mismatch");
    const history = await jsonRequest(`/conversations/${conversation.data.id}/messages`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(history.data.some((message) => message.id === ack.message.id && message.sender?.name), "history missing socket message with sender metadata");
    return `conversation=${conversation.data.id}, message=${ack.message.id}`;
  } finally {
    buyerSocket.disconnect();
    sellerSocket.disconnect();
  }
});

await fs.mkdir("test-results", { recursive: true });
await fs.writeFile(path.join("test-results", "socket-smoke-results.json"), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));

console.table(results);
if (results.some((result) => result.result === "FAIL")) process.exitCode = 1;
