import { useEffect, useState } from "react";
import ListingCard from "../components/ListingCard.jsx";
import { products as mockProducts } from "../data/mockData.js";
import { listFavorites } from "../lib/api.js";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    listFavorites()
      .then((response) => setFavorites(response.data))
      .catch((err) => {
        setError(err.message ?? "Could not load favorites.");
        setFavorites(mockProducts.filter((product) => product.isFavorited));
      });
  }, []);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-ink">Favorites</h1>
      {error && <p className="mb-4 rounded-md bg-signal/10 px-3 py-2 text-sm text-signal">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((product) => <ListingCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
