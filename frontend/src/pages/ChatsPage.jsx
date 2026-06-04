import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import ListingStatusBadge from "../components/ListingStatusBadge.jsx";
import { conversations as mockConversations } from "../data/mockData.js";
import { listConversations, resolveAssetUrl } from "../lib/api.js";

export default function ChatsPage() {
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listConversations()
      .then((response) => setConversations(response.data))
      .catch((err) => {
        setError(err.message ?? "Could not load live conversations.");
        setConversations(mockConversations);
      });
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-mav">Messages</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Chats</h1>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {error && <p className="border-b border-slate-100 bg-signal/10 px-4 py-3 text-sm text-signal">{error}</p>}
        {conversations.map((conversation) => (
          <Link key={conversation.id} to={`/chats/${conversation.id}`} className="flex gap-4 border-b border-slate-100 p-4 last:border-b-0 hover:bg-slate-50">
            <img src={resolveAssetUrl(conversation.product.imageUrl)} alt={conversation.product.title} className="h-16 w-16 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-semibold text-ink">{conversation.product.title}</p>
                <ListingStatusBadge status={conversation.product.status} />
              </div>
              <p className="mt-1 text-sm text-steel">{conversation.otherUser.name}{conversation.otherUser.schoolShortName ? ` · ${conversation.otherUser.schoolShortName}` : ""}</p>
              <p className="mt-1 truncate text-sm text-steel">{conversation.lastMessage?.content ?? "No messages yet"}</p>
            </div>
            {conversation.unreadCount > 0 && <span className="mt-2 rounded-full bg-signal px-2 py-0.5 text-xs font-bold text-white">{conversation.unreadCount}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
