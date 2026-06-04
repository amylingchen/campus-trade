import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { schools } from "../data/mockData.js";
import { registerUser } from "../lib/api.js";
import { storeSession } from "../lib/session.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await registerUser({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        schoolId: formData.get("schoolId"),
      });
      storeSession(response.data);
      navigate("/verify-school");
    } catch (err) {
      setError(err.message ?? "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-bold text-ink">Create account</h1>
        <p className="mt-2 text-sm text-steel">Choose your school community and verify your student email.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input name="name" className="w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" placeholder="Full name" required />
          <input name="email" className="w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" placeholder="name@mavs.uta.edu" type="email" required />
          <select name="schoolId" className="w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" defaultValue="school_uta">
            {schools.map((school) => <option key={school.id} value={school.id} disabled={!school.isActive}>{school.name}{school.isActive ? "" : " (coming soon)"}</option>)}
          </select>
          <input name="password" className="w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" placeholder="Password" type="password" required />
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="block w-full rounded-md bg-mav px-4 py-2 text-center font-semibold text-white focus-ring" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
