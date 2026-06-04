import { Link } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../lib/api.js";
import { storeSession } from "../lib/session.js";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await loginUser({
        email: formData.get("email"),
        password: formData.get("password"),
      });
      storeSession(response.data);
      window.location.href = "/marketplace";
    } catch (err) {
      setError(err.message ?? "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-bold text-ink">Log in</h1>
        <p className="mt-2 text-sm text-steel">Use your school account to trade inside your campus community.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input name="email" className="w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" defaultValue="maya@mavs.uta.edu" placeholder="maya@mavs.uta.edu" type="email" />
          <input name="password" className="w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" defaultValue="password123" placeholder="Password" type="password" />
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="w-full rounded-md bg-mav px-4 py-2 font-semibold text-white focus-ring" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
        </form>
        <p className="mt-4 text-sm text-steel">New here? <Link to="/auth/register" className="font-semibold text-mav">Create account</Link></p>
      </div>
    </div>
  );
}
