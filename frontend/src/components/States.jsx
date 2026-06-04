export function EmptyState({ title, message, action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-steel">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function VerificationGate({ children }) {
  return (
    <div className="rounded-lg border border-signal/30 bg-signal/10 p-4 text-sm text-ink">
      <p className="font-semibold">School verification required</p>
      <p className="mt-1 text-steel">{children}</p>
    </div>
  );
}
