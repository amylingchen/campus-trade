import { Home, MessageSquare, PlusCircle, Search, UserRound } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { getStoredUser } from "../lib/session.js";

const navItems = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/courses", label: "Course Items" },
  { to: "/listings/new", label: "Sell" },
  { to: "/chats", label: "Chats" },
  { to: "/me", label: "My Account" },
];

const mobileItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/marketplace", label: "Search", icon: Search },
  { to: "/listings/new", label: "Sell", icon: PlusCircle },
  { to: "/chats", label: "Chats", icon: MessageSquare },
  { to: "/me", label: "Me", icon: UserRound },
];

export default function AppShell({ children }) {
  const user = getStoredUser();
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-mav text-sm font-bold text-white">CT</span>
            <div>
              <p className="text-base font-semibold text-ink">Campus Trade</p>
              <p className="text-xs text-steel">UTA marketplace</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-mav text-white" : "text-steel hover:bg-slate-100 hover:text-ink"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Link to={user ? "/me" : "/auth/login"} className="hidden items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm md:flex">
            <span className={`h-2 w-2 rounded-full ${user ? "bg-mint" : "bg-slate-300"}`} />
            {user ? user.name : "Log in"}
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white md:hidden">
        <div className="grid grid-cols-5">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-2 py-2 text-xs ${isActive ? "text-mav" : "text-steel"}`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
