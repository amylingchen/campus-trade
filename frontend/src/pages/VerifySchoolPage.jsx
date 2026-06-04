import { useEffect, useState } from "react";
import { confirmVerificationCode, getCurrentUser, sendVerificationCode } from "../lib/api.js";
import { getStoredUser, updateStoredUser } from "../lib/session.js";

export default function VerifySchoolPage() {
  const [user, setUser] = useState(getStoredUser());
  const [devCode, setDevCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentUser()
      .then((response) => setUser(response.data))
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    setError("");
    const response = await sendVerificationCode({ email: user.email });
    setDevCode(response.data.devCode ?? "");
    setMessage("Verification code sent.");
  };

  const handleConfirm = async (event) => {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    try {
      const response = await confirmVerificationCode({ code: formData.get("code") });
      const updated = updateStoredUser(response.data);
      setUser((current) => ({ ...current, ...updated }));
      setMessage("School email verified.");
    } catch (err) {
      setError(err.message ?? "Verification failed.");
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold text-mav">School verification</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Verify your UTA email</h1>
        <p className="mt-2 text-sm text-steel">A local dev backend can log the verification code to the console. Production can swap this for real email delivery.</p>
        <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm text-steel">{user?.email ?? "Please log in first."}</div>
        <button onClick={handleSend} className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink">Send code</button>
        {devCode && <p className="mt-3 rounded-md bg-mav/10 px-3 py-2 text-sm text-mav">Local dev code: <span className="font-mono">{devCode}</span></p>}
        {message && <p className="mt-3 rounded-md bg-mint/10 px-3 py-2 text-sm text-mint">{message}</p>}
        {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleConfirm}>
          <input name="code" className="rounded-md border border-slate-300 px-3 py-2 focus-ring" placeholder="123456" />
          <button className="rounded-md bg-mav px-4 py-2 font-semibold text-white focus-ring">Confirm</button>
        </form>
      </div>
    </div>
  );
}
