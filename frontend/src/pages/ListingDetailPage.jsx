import { Flag, Heart, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CourseTag from "../components/CourseTag.jsx";
import ListingStatusBadge from "../components/ListingStatusBadge.jsx";
import { VerificationGate } from "../components/States.jsx";
import { categoryLabels, conditionLabels, products, usageLabels } from "../data/mockData.js";
import { addFavorite, getProduct, listFavorites, removeFavorite, resolveAssetUrl, setProductStatus, startConversation } from "../lib/api.js";
import { getStoredUser } from "../lib/session.js";

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [liveProduct, setLiveProduct] = useState(null);
  const [error, setError] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const product = liveProduct ?? products.find((item) => item.id === id) ?? products[0];
  const user = getStoredUser();
  const isOwner = Boolean(user && product.sellerId === user.id);
  const isSold = product.status === "sold";

  useEffect(() => {
    let alive = true;
    getProduct(id)
      .then((response) => {
        if (!alive) return;
        setLiveProduct(response.data);
        setIsFavorited(Boolean(response.data.isFavorited));
      })
      .catch((err) => {
        if (alive) setError(err.message ?? "Could not load live product.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user?.verifiedStudent) return;
    let alive = true;
    listFavorites()
      .then((response) => {
        if (alive) setIsFavorited(response.data.some((item) => item.id === id));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, user?.verifiedStudent]);

  const handleMessage = async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    if (!user.verifiedStudent) {
      navigate("/verify-school");
      return;
    }
    try {
      setError("");
      const response = await startConversation(product.id);
      navigate(`/chats/${response.data.id}`);
    } catch (err) {
      setError(err.message ?? "Could not start conversation.");
    }
  };

  const handleFavorite = async () => {
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
      setError("");
      if (next) {
        await addFavorite(product.id);
      } else {
        await removeFavorite(product.id);
      }
    } catch (err) {
      setIsFavorited(!next);
      setError(err.message ?? "Could not update saved listing.");
    } finally {
      setFavoriteBusy(false);
    }
  };

  const handleSold = async () => {
    await setProductStatus(product.id, "sold");
    setLiveProduct((current) => ({ ...current, status: "sold" }));
  };

  const actionArea = () => {
    if (isOwner) {
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <Link to={`/listings/${product.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-md bg-mav px-4 py-2 text-sm font-semibold text-white"><Pencil size={17} /> Edit</Link>
          <button onClick={handleSold} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink">Mark sold</button>
          <button className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700"><Trash2 size={17} /> Delete</button>
        </div>
      );
    }
    if (!user) {
      return <VerificationGate>Log in with your school account to save listings, report issues, or message the seller.</VerificationGate>;
    }
    if (!user.verifiedStudent) {
      return <VerificationGate>Verify your school email before saving listings, reporting issues, or messaging the seller.</VerificationGate>;
    }
    if (isSold) {
      return <VerificationGate>This item has been sold. Existing buyers can still view their chat history.</VerificationGate>;
    }
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <button onClick={handleMessage} className="inline-flex items-center justify-center gap-2 rounded-md bg-mav px-4 py-2 text-sm font-semibold text-white"><MessageSquare size={17} /> Message Seller</button>
        <button onClick={handleFavorite} className={`inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold ${isFavorited ? "border-mav bg-mav/10 text-mav" : "border-slate-300 bg-white text-ink"}`} disabled={favoriteBusy}>
          <Heart size={17} fill={isFavorited ? "currentColor" : "none"} /> {isFavorited ? "Saved" : "Save"}
        </button>
        <button className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink"><Flag size={17} /> Report</button>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="order-1 overflow-hidden rounded-lg border border-slate-200 bg-white lg:order-1">
          <img src={resolveAssetUrl(product.images?.[0]?.imageUrl ?? product.imageUrl)} alt={product.title} className={`aspect-[4/3] w-full object-cover ${isSold ? "grayscale" : ""}`} />
        </div>

        <section className="order-2 space-y-5 lg:order-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                {product.status !== "available" && <ListingStatusBadge status={product.status} />}
                <h1 className={`${product.status !== "available" ? "mt-3" : ""} text-2xl font-bold text-ink sm:text-3xl`}>{product.title}</h1>
              </div>
              <p className="whitespace-nowrap text-2xl font-bold text-ink sm:text-3xl">${product.price}</p>
            </div>

            <div className="mt-5">{actionArea()}</div>

            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-steel">{categoryLabels[product.category]}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-steel">{conditionLabels[product.condition]}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-steel">{usageLabels[product.usageType]}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-steel">{product.location}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-steel">{product.negotiable ? "Negotiable" : "Firm price"}</span>
            </div>

            {product.courseCodes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.courseCodes.map((code) => <CourseTag key={code} code={code} />)}
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-base font-bold text-ink">Description</h2>
              <p className="mt-2 leading-7 text-steel">{product.description}</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-steel">Seller</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <Link to={`/profile/${product.seller.id}`} className="font-semibold text-ink hover:text-mav">{product.seller.name}</Link>
                <p className="text-sm text-steel">Verified {product.seller.schoolShortName} student</p>
              </div>
              <span className="rounded-full bg-mint/10 px-2.5 py-1 text-xs font-semibold text-mint">Verified</span>
            </div>
          </div>

          {error && <p className="rounded-md bg-signal/10 px-3 py-2 text-sm text-signal">{error}</p>}
        </section>
      </div>
    </div>
  );
}
