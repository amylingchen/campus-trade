import { Link, Navigate, useLocation } from "react-router-dom";
import { getStoredUser, hasSession } from "../lib/session.js";

function GuardMessage({ title, message, action }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-soft">
        <p className="text-sm font-semibold text-mav">{title}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{message}</h1>
        <div className="mt-5">{action}</div>
      </div>
    </div>
  );
}

export default function AuthGuard({ children, requireVerified = false }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!hasSession()) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (requireVerified && !user?.verifiedStudent) {
    return (
      <GuardMessage
        title="School verification"
        message="Verify your student email before using this feature."
        action={
          <Link to="/verify-school" className="inline-flex rounded-md bg-mav px-4 py-2 text-sm font-semibold text-white focus-ring">
            Verify school email
          </Link>
        }
      />
    );
  }

  return children;
}
