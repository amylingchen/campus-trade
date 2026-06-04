import { io } from "socket.io-client";
import { SOCKET_URL } from "./api.js";

export function createChatSocket() {
  const token = localStorage.getItem("campusTradeToken");
  if (!token) return null;
  return io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 4,
  });
}

export function emitWithAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (response) => {
      if (response?.ok) resolve(response.data);
      else reject(response?.error ?? new Error(`${event} failed`));
    });
  });
}
