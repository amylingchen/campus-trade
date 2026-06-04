import { Heart, MapPin } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { categoryLabels, conditionLabels } from "../data/mockData.js";
import { addFavorite, removeFavorite, resolveAssetUrl } from "../lib/api.js";
import { getStoredUser } from "../lib/session.js";
import CourseTag from "./CourseTag.jsx";
import ListingStatusBadge from "./ListingStatusBadge.jsx";

export default function ListingCard({ product, compact = false }) {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(Boolean(product.isFavorited));
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const isSold = product.status === "sold";
  const showStatus = product.status && product.status !== "available";

  const handleFavorite = async () => {
    const user = getStoredUser();
    if (!user) {
      navigate("/auth/login");
      return;
    }
    if (!user.verifiedStudent) {
      navigate("/verify-school");
      return;
    }
    if (favoriteBusy) return;
    const next = !isFavorited;
    setIsFavorited(next);
    setFavoriteBusy(true);
    try {
      if (next) {
        await addFavorite(product.id);
      } else {
        await removeFavorite(product.id);
      }
    } catch {
      setIsFavorited(!next);
    } finally {
      setFavoriteBusy(false);
    }
  };

  return (
    <article className={`overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft ${isSold ? "opacity-90" : ""}`}>
      <div className="relative aspect-square bg-slate-200 sm:aspect-[4/3]">
        <Link to={`/listings/${product.id}`} className="block h-full">
          <img src={resolveAssetUrl(product.imageUrl)} alt={product.title} className={`h-full w-full object-cover ${isSold ? "grayscale" : ""}`} />
          {isSold && <div className="absolute inset-0 bg-slate-900/35" />}
          {showStatus && (
            <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
              <ListingStatusBadge status={product.status} />
            </div>
          )}
        </Link>
        <button
          type="button"
          className={`absolute right-2 top-2 rounded-full bg-white/95 p-1.5 shadow-sm transition sm:right-3 sm:top-3 sm:p-2 ${isFavorited ? "text-mav" : "text-steel hover:text-mav"}`}
          onClick={handleFavorite}
          aria-label={isFavorited ? "Unsave listing" : "Save listing"}
          disabled={favoriteBusy}
        >
          <Heart size={compact ? 14 : 17} fill={isFavorited ? "currentColor" : "none"} />
        </button>
        {isSold && (
          <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white">
            Sold
          </div>
        )}
      </div>
      <div className={compact ? "space-y-1.5 p-2.5 sm:space-y-3 sm:p-4" : "space-y-3 p-4"}>
        <div className={compact ? "space-y-1 sm:flex sm:items-start sm:justify-between sm:gap-3" : "flex items-start justify-between gap-3"}>
          <div className="min-w-0">
            <Link to={`/listings/${product.id}`} className={`${compact ? "line-clamp-2 text-sm sm:text-base" : ""} font-semibold ${isSold ? "text-slate-500" : "text-ink hover:text-mav"}`}>
              {product.title}
            </Link>
            <p className={`${compact ? "mt-0.5 truncate text-xs sm:mt-1 sm:text-sm" : "mt-1 text-sm"} ${isSold ? "text-slate-400" : "text-steel"}`}>
              {categoryLabels[product.category]} - {conditionLabels[product.condition]}
            </p>
          </div>
          <p className={`${compact ? "text-base sm:text-lg" : "text-lg"} whitespace-nowrap font-bold ${isSold ? "text-slate-500" : "text-ink"}`}>${product.price}</p>
        </div>
        {!compact && product.courseCodes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.courseCodes.map((code) => (
              <CourseTag key={code} code={code} />
            ))}
          </div>
        )}
        <p className={`${compact ? "truncate text-xs sm:text-sm" : "text-sm"} flex items-center gap-1 ${isSold ? "text-slate-400" : "text-steel"}`}>
          <MapPin size={compact ? 13 : 15} />
          {product.location}
        </p>
      </div>
    </article>
  );
}
