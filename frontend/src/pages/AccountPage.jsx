import { Heart, MessageSquare, Package, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { schools } from "../data/mockData.js";
import { getCurrentUser } from "../lib/api.js";
import { getStoredUser } from "../lib/session.js";

export default function AccountPage() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  useEffect(() => {
    getCurrentUser().then((response) => setCurrentUser(response.data)).catch(() => {});
  }, []);
  const school = schools.find((item) => item.id === currentUser?.schoolId) ?? schools[0];
  const links = [
    { to: "/me/listings", label: "My listings", icon: Package },
    { to: "/me/favorites", label: "Favorites", icon: Heart },
    { to: "/chats", label: "Chats", icon: MessageSquare },
    { to: "/verify-school", label: "Verification", icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-mav">My Account</p>
            <h1 className="mt-1 text-3xl font-bold text-ink">{currentUser?.name ?? "Not logged in"}</h1>
            <p className="mt-1 text-steel">{currentUser?.major ?? "Student"} · {school.shortName}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-mint/10 px-3 py-1 text-sm font-semibold text-mint">
            <ShieldCheck size={17} />
            {currentUser?.verifiedStudent ? "Verified student" : "Verification needed"}
          </span>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 hover:shadow-soft">
              <span className="rounded-md bg-mav/10 p-2 text-mav"><Icon size={20} /></span>
              <span className="font-semibold text-ink">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
