import { CalendarDays, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ListingCard from "../components/ListingCard.jsx";
import { EmptyState } from "../components/States.jsx";
import { products as mockProducts, users } from "../data/mockData.js";
import { getUserProfile, listUserProducts, resolveAssetUrl } from "../lib/api.js";

export default function ProfilePage() {
  const { id } = useParams();
  const mockUser = users.find((item) => item.id === id) ?? users[0];
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState(mockProducts.filter((product) => product.sellerId === mockUser.id));
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      getUserProfile(id),
      listUserProducts(id, { status: "available,pending,sold" }),
    ])
      .then(([profileResponse, productsResponse]) => {
        if (!alive) return;
        setProfile(profileResponse.data);
        setListings(productsResponse.data);
      })
      .catch((err) => {
        if (alive) setError(err.message ?? "Could not load live seller profile.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const activeListings = listings.filter((product) => product.status !== "sold" && product.status !== "removed");
  const soldListings = listings.filter((product) => product.status === "sold");

  const seller = profile ?? {
    id: mockUser.id,
    name: mockUser.name,
    avatarUrl: mockUser.avatarUrl,
    major: mockUser.major,
    bio: mockUser.bio,
    schoolShortName: "UTA",
    verifiedStudent: mockUser.verifiedStudent,
    joinedAt: mockUser.createdAt,
    stats: { activeListingCount: listings.length, soldListingCount: 0 },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
        {error && <p className="mb-4 rounded-md bg-signal/10 px-3 py-2 text-sm text-signal">{error}</p>}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mav/10 text-xl font-bold text-mav">
              {seller.avatarUrl ? <img src={resolveAssetUrl(seller.avatarUrl)} alt={seller.name} className="h-full w-full object-cover" /> : seller.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-ink">{seller.name}</h1>
                {seller.verifiedStudent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-mint/10 px-2.5 py-1 text-xs font-semibold text-mint">
                    <ShieldCheck size={14} />
                    Verified
                  </span>
                )}
              </div>
              <p className="mt-1 text-steel">{seller.major ?? "Student"} · {seller.schoolShortName}</p>
              {seller.bio && <p className="mt-3 max-w-2xl leading-7 text-steel">{seller.bio}</p>}
              <p className="mt-3 flex items-center gap-2 text-sm text-steel">
                <CalendarDays size={16} />
                Joined {seller.joinedAt ? new Date(seller.joinedAt).toLocaleDateString() : "recently"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-56">
            <div className="rounded-md bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-ink">{seller.stats?.activeListingCount ?? listings.length}</p>
              <p className="text-xs font-semibold uppercase text-steel">Active</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-ink">{seller.stats?.soldListingCount ?? 0}</p>
              <p className="text-xs font-semibold uppercase text-steel">Sold</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-4">
        <p className="text-sm font-semibold text-mav">Seller listings</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">Items from {seller.name}</h2>
      </div>
      {listings.length === 0 ? (
        <EmptyState title="No active listings" message="This seller does not have active listings right now." />
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 inline-flex items-center rounded-full bg-mint/10 px-3 py-1 text-sm font-bold text-mint">
              Available ({activeListings.length})
            </div>
            {activeListings.length === 0 ? (
              <EmptyState title="No available listings" message="This seller does not have active listings right now." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeListings.map((product) => <ListingCard key={product.id} product={product} />)}
              </div>
            )}
          </section>

          {soldListings.length > 0 && (
            <section>
              <div className="mb-3 inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-700">
                Sold ({soldListings.length})
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {soldListings.map((product) => <ListingCard key={product.id} product={product} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
