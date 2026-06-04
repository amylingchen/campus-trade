import { categoryLabels, conditionLabels } from "../data/mockData.js";

export default function FilterPanel({ filters, setFilters, includeSearch = false, includeStatus = true }) {
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      {includeSearch && (
        <div>
          <label className="text-sm font-semibold text-ink">Search</label>
          <input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-ring" placeholder="Raspberry Pi, textbook, bike..." value={filters.q} onChange={(event) => update("q", event.target.value)} />
        </div>
      )}
      <div>
        <label className="text-sm font-semibold text-ink">Category</label>
        <select className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-ring" value={filters.category} onChange={(event) => update("category", event.target.value)}>
          <option value="">All categories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold text-ink">Condition</label>
        <select className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-ring" value={filters.condition} onChange={(event) => update("condition", event.target.value)}>
          <option value="">Any condition</option>
          {Object.entries(conditionLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      {includeStatus && (
        <div>
          <label className="text-sm font-semibold text-ink">Status</label>
          <select className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-ring" value={filters.status} onChange={(event) => update("status", event.target.value)}>
            <option value="">Any status</option>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      )}
      <div>
        <label className="text-sm font-semibold text-ink">Course code</label>
        <input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-ring" placeholder="CSE 3442" value={filters.courseCode} onChange={(event) => update("courseCode", event.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-semibold text-ink">Min</label>
          <input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-ring" placeholder="$0" value={filters.minPrice} onChange={(event) => update("minPrice", event.target.value)} />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">Max</label>
          <input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-ring" placeholder="$100" value={filters.maxPrice} onChange={(event) => update("maxPrice", event.target.value)} />
        </div>
      </div>
    </aside>
  );
}
