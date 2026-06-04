const statusClasses = {
  available: "bg-mint/10 text-mint",
  pending: "bg-signal/10 text-signal",
  sold: "bg-slate-200 text-steel",
  removed: "bg-red-100 text-red-700",
};

export default function ListingStatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status] ?? statusClasses.available}`}>
      {status}
    </span>
  );
}
