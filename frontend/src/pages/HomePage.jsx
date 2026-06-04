import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ListingCard from "../components/ListingCard.jsx";
import { EmptyState } from "../components/States.jsx";
import { categoryLabels, products as mockProducts, schools as mockSchools } from "../data/mockData.js";
import { listProducts, listSchools } from "../lib/api.js";
import { getSelectedSchoolId, setSelectedSchoolId } from "../lib/school.js";
import { getStoredUser } from "../lib/session.js";

export default function HomePage() {
  const user = getStoredUser();
  const [schools, setSchools] = useState(mockSchools);
  const [schoolId, setSchoolId] = useState(user?.schoolId ?? getSelectedSchoolId());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSchools().then((response) => setSchools(response.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedSchoolId(schoolId);
    setLoading(true);
    listProducts({ schoolId, q: query, category, status: "available", pageSize: 24 })
      .then((response) => setProducts(response.data))
      .catch(() => setProducts(mockProducts.filter((product) => product.schoolId === schoolId)))
      .finally(() => setLoading(false));
  }, [schoolId, query, category]);

  const activeSchool = useMemo(() => schools.find((school) => school.id === schoolId) ?? schools[0], [schools, schoolId]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-mav">Campus market</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">{activeSchool?.shortName ?? "School"} marketplace</h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-[220px_auto]">
          <label className="sr-only" htmlFor="school-select">School</label>
          <select
            id="school-select"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-ring"
            value={schoolId}
            onChange={(event) => setSchoolId(event.target.value)}
          >
            {schools.map((school) => (
              <option key={school.id} value={school.id} disabled={!school.isActive}>
                {school.shortName} - {school.name}{school.isActive ? "" : " (soon)"}
              </option>
            ))}
          </select>
          <Link to="/listings/new" className="rounded-md bg-mav px-4 py-2 text-center text-sm font-semibold text-white focus-ring">
            Sell
          </Link>
        </div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_240px]">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={20} className="text-steel" />
          <input className="w-full bg-transparent py-1 focus:outline-none" placeholder="Search Raspberry Pi, textbook, bike..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <SlidersHorizontal size={18} className="text-steel" />
          <select className="w-full bg-transparent py-1 text-sm focus:outline-none" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <EmptyState title="Loading market" message="Fetching current campus listings." />
      ) : products.length === 0 ? (
        <EmptyState title="No listings here yet" message="Try another search, category, or school." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => <ListingCard key={product.id} product={product} />)}
        </div>
      )}

      <section className="mt-10">
        <div className="mb-4">
          <p className="text-sm font-semibold text-mav">Browse faster</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Popular campus categories</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryLabels).slice(0, 8).map(([value, label]) => (
            <button key={value} type="button" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-mav hover:text-mav" onClick={() => setCategory(value)}>
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
