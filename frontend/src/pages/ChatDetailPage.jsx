import { Send, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ListingStatusBadge from "../components/ListingStatusBadge.jsx";
import { conversations as mockConversations, messages as mockMessages } from "../data/mockData.js";
import { getConversation, listMessages, markConversationRead, resolveAssetUrl, sendMessage } from "../lib/api.js";
import { createChatSocket, emitWithAck } from "../lib/socket.js";
import { getStoredUser } from "../lib/session.js";

export default function ChatDetailPage() {
  const { id } = useParams();
  const user = getStoredUser();
  const [conversation, setConversation] = useState(mockConversations.find((item) => item.id === id) ?? mockConversations[0]);
  const [thread, setThread] = useState(mockMessages[id] ?? []);
  const [socketState, setSocketState] = useState("connecting");
  const [error, setError] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getConversation(id), listMessages(id)])
      .then(([conversationResponse, messageResponse]) => {
        if (!alive) return;
        setConversation(conversationResponse.data);
        setThread(messageResponse.data);
        markConversationRead(id).catch(() => {});
      })
      .catch((err) => {
        if (alive) setError(err.message ?? "Could not load live conversation.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    const socket = createChatSocket();
    if (!socket) {
      setSocketState("offline");
      return undefined;
    }
    socketRef.current = socket;

    socket.on("connect", async () => {
      setSocketState("live");
      try {
        await emitWithAck(socket, "conversation:join", { conversationId: id });
      } catch (err) {
        setError(err.message ?? "Could not join live chat.");
      }
    });
    socket.on("connect_error", () => setSocketState("offline"));
    socket.on("disconnect", () => setSocketState("offline"));
    socket.on("message:new", (payload) => {
      if (payload.conversationId !== id) return;
      setThread((current) => current.some((message) => message.id === payload.message.id) ? current : [...current, payload.message]);
      if (payload.message.senderId !== user?.id) {
        markConversationRead(id, { readUntilMessageId: payload.message.id }).catch(() => {});
        socket.emit("message:read", { conversationId: id, readUntilMessageId: payload.message.id });
      }
    });
    socket.on("message:read", (payload) => {
      if (payload.conversationId !== id || payload.readerId === user?.id) return;
      setThread((current) => current.map((message) => message.senderId === user?.id && !message.readAt ? { ...message, readAt: payload.readAt } : message));
    });
    socket.on("message:error", (payload) => setError(payload?.message ?? payload?.error?.message ?? "Live message failed."));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id, user?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const content = String(formData.get("content") ?? "").trim();
    if (!content) return;
    event.currentTarget.reset();
    const socket = socketRef.current;
    try {
      if (socket?.connected) {
        const response = await emitWithAck(socket, "message:send", {
          conversationId: id,
          clientMessageId: `client_${Date.now()}`,
          content,
        });
        setThread((current) => current.some((message) => message.id === response.message.id) ? current : [...current, response.message]);
        return;
      }
      const response = await sendMessage(id, { content });
      setThread((current) => [...current, response.data]);
    } catch (err) {
      setError(err.message ?? "Could not send message.");
    }
  };

  const otherUser = conversation.otherUser ?? {};

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex h-[calc(100vh-120px)] min-h-[620px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center justify-between gap-4">
            <Link to={`/listings/${conversation.product.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-ring">
              <img src={resolveAssetUrl(conversation.product.imageUrl)} alt={conversation.product.title} className="h-14 w-14 rounded-md object-cover" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink hover:text-mav">{conversation.product.title} · ${conversation.product.price}</p>
                <p className="text-sm text-steel">Open listing details</p>
              </div>
            </Link>
            <ListingStatusBadge status={conversation.product.status} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <Link to={`/profile/${otherUser.id}`} className="flex min-w-0 items-center gap-3 rounded-md focus-ring">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mav/10 text-sm font-bold text-mav">
              {otherUser.avatarUrl ? <img src={resolveAssetUrl(otherUser.avatarUrl)} alt={otherUser.name} className="h-full w-full object-cover" /> : otherUser.name?.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink hover:text-mav">{otherUser.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${socketState === "live" ? "bg-mint/10 text-mint" : "bg-slate-200 text-steel"}`}>
                  {socketState === "live" ? "Live" : "REST fallback"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-steel">
                <span>Chat participant</span>
                {otherUser.verifiedStudent && <span className="inline-flex items-center gap-1 rounded-full bg-mint/10 px-2 py-0.5 font-semibold text-mint"><ShieldCheck size={12} /> Verified</span>}
                {otherUser.schoolShortName && <span>{otherUser.schoolShortName}</span>}
              </div>
            </div>
          </Link>
        </div>

        {error && <p className="bg-signal/10 px-4 py-3 text-sm text-signal">{error}</p>}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {thread.map((message) => {
          const mine = message.senderId === user?.id;
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-lg px-4 py-2 text-sm ${mine ? "bg-mav text-white" : "bg-slate-100 text-ink"}`}>
                {!mine && message.sender?.name && <p className="mb-1 text-xs font-semibold text-steel">{message.sender.name}</p>}
                <p>{message.content}</p>
                {mine && <p className="mt-1 text-right text-[11px] opacity-75">{message.readAt ? "Read" : "Sent"}</p>}
              </div>
            </div>
          );
        })}
      </div>
      <form className="flex gap-2 border-t border-slate-200 bg-white p-4" onSubmit={handleSubmit}>
        <input name="content" className="flex-1 rounded-md border border-slate-300 px-3 py-2 focus-ring" placeholder="Type message..." />
        <button className="inline-flex items-center gap-2 rounded-md bg-mav px-4 py-2 font-semibold text-white focus-ring"><Send size={17} /> Send</button>
      </form>
      </section>
    </div>
  );
}
