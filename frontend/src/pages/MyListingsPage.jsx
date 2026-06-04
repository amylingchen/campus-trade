import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import ListingCard from "../components/ListingCard.jsx";
import { currentUser as mockUser, products as mockProducts } from "../data/mockData.js";
import { getCurrentUser, listProducts } from "../lib/api.js";

export default function MyListingsPage() {
  const [mine, setMine] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    async function loadMine() {
      try {
        const me = await getCurrentUser();
        const listings = await listProducts({ schoolId: me.data.schoolId, sellerId: me.data.id });
        setMine(listings.data);
      } catch (err) {
        setError(err.message ?? "Could not load my listings.");
        setMine(mockProducts.filter((product) => product.sellerId === mockUser.id));
      }
    }
    loadMine();
  }, []);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-ink">My listings</h1>
        <Link to="/listings/new" className="rounded-md bg-mav px-4 py-2 text-sm font-semibold text-white">New listing</Link>
      </div>
      {error && <p className="mb-4 rounded-md bg-signal/10 px-3 py-2 text-sm text-signal">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mine.map((product) => <ListingCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
