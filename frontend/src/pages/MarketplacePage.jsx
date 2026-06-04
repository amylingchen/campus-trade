import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import FilterPanel from "../components/FilterPanel.jsx";
import ListingCard from "../components/ListingCard.jsx";
import { EmptyState } from "../components/States.jsx";
import { products as mockProducts, schools as mockSchools } from "../data/mockData.js";
import { listCourseProducts, listProducts, listSchools } from "../lib/api.js";
import { getSelectedSchoolId, setSelectedSchoolId } from "../lib/school.js";
import { getStoredUser } from "../lib/session.js";

export default function MarketplacePage({ courseRoute = false }) {
  const { courseCode } = useParams();
  const user = getStoredUser();
  const [schools, setSchools] = useState(mockSchools);
  const [filters, setFilters] = useState({
    schoolId: user?.schoolId ?? getSelectedSchoolId(),
    q: "",
    category: "",
    condition: "",
    status: "available",
    courseCode: courseRoute ? courseCode : "",
    minPrice: "",
    maxPrice: "",
    sort: "latest",
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobilePanel, setMobilePanel] = useState(null);

  useEffect(() => {
    listSchools().then((response) => setSchools(response.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadProducts() {
      setLoading(true);
      setError("");
      try {
        setSelectedSchoolId(filters.schoolId);
        const params = { ...filters, status: "available" };
        const response = courseRoute
          ? await listCourseProducts(courseCode, params)
          : await listProducts(params);
        if (alive) setProducts(response.data);
      } catch (err) {
        if (alive) {
          setError(err.message ?? "Could not load live products. Showing mock data.");
          setProducts(mockProducts);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      alive = false;
    };
  }, [filters, courseRoute, courseCode]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const q = filters.q.trim().toLowerCase();
        const course = filters.courseCode.trim().toLowerCase().replace(/\s+/g, "");
        const productCourses = product.courseCodes.map((code) => code.toLowerCase().replace(/\s+/g, ""));
        return (
          (!q || `${product.title} ${product.description}`.toLowerCase().includes(q)) &&
          (!filters.category || product.category === filters.category) &&
          (!filters.condition || product.condition === filters.condition) &&
          product.status !== "sold" &&
          product.status !== "removed" &&
          (!filters.status || product.status === filters.status) &&
          (!course || productCourses.some((code) => code.includes(course))) &&
          (!filters.minPrice || product.price >= Number(filters.minPrice)) &&
          (!filters.maxPrice || product.price <= Number(filters.maxPrice))
        );
      })
      .sort((a, b) => {
        if (filters.sort === "price_asc") return a.price - b.price;
        if (filters.sort === "price_desc") return b.price - a.price;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [filters, products]);

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-mav">{courseRoute ? "Course listings" : "UTA Marketplace"}</p>
          <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{courseRoute ? decodeURIComponent(courseCode) : "Find campus items"}</h1>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-ring" value={filters.schoolId} onChange={(event) => setFilters((current) => ({ ...current, schoolId: event.target.value }))}>
            {schools.map((school) => (
              <option key={school.id} value={school.id} disabled={!school.isActive}>{school.shortName} - {school.name}</option>
            ))}
          </select>
          <select className="hidden w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-ring md:block" value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}>
            <option value="latest">Latest</option>
            <option value="price_asc">Lowest price</option>
            <option value="price_desc">Highest price</option>
          </select>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 md:hidden">
        <Search size={18} className="text-steel" />
        <input className="w-full bg-transparent py-1 text-sm focus:outline-none" placeholder="Search Raspberry Pi, textbook, bike..." value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 md:hidden">
        <button type="button" className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${mobilePanel === "sort" ? "border-mav bg-mav text-white" : "border-slate-200 bg-white text-ink"}`} onClick={() => setMobilePanel((current) => current === "sort" ? null : "sort")}>
          <SlidersHorizontal size={16} /> Sort
        </button>
        <button type="button" className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${mobilePanel === "filter" ? "border-mav bg-mav text-white" : "border-slate-200 bg-white text-ink"}`} onClick={() => setMobilePanel((current) => current === "filter" ? null : "filter")}>
          <Filter size={16} /> Filter
        </button>
      </div>

      {mobilePanel && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold capitalize text-ink">{mobilePanel}</p>
            <button type="button" className="rounded-md p-1 text-steel" onClick={() => setMobilePanel(null)} aria-label="Close panel">
              <X size={18} />
            </button>
          </div>
          {mobilePanel === "sort" && (
            <select className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-ring" value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}>
              <option value="latest">Latest</option>
              <option value="price_asc">Lowest price</option>
              <option value="price_desc">Highest price</option>
            </select>
          )}
          {mobilePanel === "filter" && <FilterPanel filters={filters} setFilters={setFilters} includeSearch={false} includeStatus={false} />}
        </div>
      )}

      <div className="mb-5 hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 md:flex">
        <Search size={20} className="text-steel" />
        <input className="w-full bg-transparent py-1 focus:outline-none" placeholder="Search Raspberry Pi, textbook, bike..." value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="hidden lg:block">
          <FilterPanel filters={filters} setFilters={setFilters} includeStatus={false} />
        </div>
        {loading ? (
          <EmptyState title="Loading live listings" message="Fetching products from the Express API." />
        ) : filteredProducts.length === 0 ? (
          <EmptyState title="No listings found" message={error || "Try clearing a filter or searching a different course code."} />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => <ListingCard key={product.id} product={product} compact />)}
          </div>
        )}
      </div>
    </div>
  );
}
