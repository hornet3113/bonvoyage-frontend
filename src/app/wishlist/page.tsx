"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { IoBookmark, IoLocationSharp, IoAirplane, IoTrash } from "react-icons/io5";
import Link from "next/link";
import Header from "@/app/components/Header";
import { createApiClient } from "@/lib/api";

const MONTH_NAMES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function parsePopularMonths(raw: string): string {
  if (raw.includes(",")) {
    return raw.split(",").map((n) => MONTH_NAMES[parseInt(n)] ?? n).filter(Boolean).join(", ");
  }

  const months: string[] = [];
  let i = 0;
  while (i < raw.length) {
    const two = parseInt(raw.slice(i, i + 2));
    if (i + 1 < raw.length && two >= 10 && two <= 12) {
      months.push(MONTH_NAMES[two]);
      i += 2;
    } else {
      const one = parseInt(raw[i]);
      if (one >= 1 && one <= 9) months.push(MONTH_NAMES[one]);
      i += 1;
    }
  }
  return months.length > 0 ? months.join(", ") : raw;
}

type WishlistItem = {
  wishlist_id: string;
  city: string;
  country: string;
  destination_image: string | null;
  latitude: number;
  longitude: number;
  destination_id: string;
  currency_code: string | null;
  popular_months: string | null;
  min_flight_price: number | null;
  created_at: string;
};

export default function WishlistPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const api = createApiClient(getToken);
    try {
      const data = await api.get<{ data?: WishlistItem[] } & WishlistItem[]>("/api/v1/wishlist");
      setItems(data.data ?? data ?? []);
    } catch {
      setError("No se pudo cargar la wishlist.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(wishlistId: string) {
    setRemoving(wishlistId);
    const api = createApiClient(getToken);
    try {
      await api.delete(`/api/v1/wishlist/${wishlistId}`);
      setItems((prev) => prev.filter((i) => i.wishlist_id !== wishlistId));
    } catch {
      // silent fail
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant="dark" />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Wishlist</h1>
            {!loading && items.length > 0 && (
              <p className="text-sm text-gray-400 mt-0.5">{items.length} {items.length === 1 ? "destino guardado" : "destinos guardados"}</p>
            )}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-52 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <IoBookmark className="text-5xl text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <IoBookmark className="text-5xl text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-sm font-medium">Tu wishlist está vacía</p>
            <p className="text-gray-400 text-xs mt-1 mb-4">Guarda destinos desde el mapa para verlos aquí</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors">
              Explorar destinos
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <WishlistCard
                key={item.wishlist_id}
                item={item}
                removing={removing === item.wishlist_id}
                onRemove={() => handleRemove(item.wishlist_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WishlistCard({
  item,
  removing,
  onRemove,
}: {
  item: WishlistItem;
  removing: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-36 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
        {item.destination_image ? (
          <img src={item.destination_image} alt={item.city} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IoLocationSharp className="text-white/40 text-5xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-bold text-base leading-tight drop-shadow">{item.city}</p>
          <p className="text-white/80 text-xs">{item.country}</p>
        </div>
        <button
          onClick={onRemove}
          disabled={removing}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors disabled:opacity-50"
        >
          <IoTrash className="text-sm" />
        </button>
      </div>

      {/* Details */}
      <div className="p-3 space-y-2">
        {item.min_flight_price && (
          <div className="flex items-center gap-1.5">
            <IoAirplane className="text-blue-400 text-xs flex-shrink-0" />
            <span className="text-xs text-gray-600">
              Vuelos desde <span className="font-semibold text-blue-600">${item.min_flight_price} {item.currency_code ?? "USD"}</span>
            </span>
          </div>
        )}
        {item.popular_months && (
          <p className="text-xs text-gray-400">
            Mejor época: <span className="text-gray-600">{parsePopularMonths(item.popular_months)}</span>
          </p>
        )}
        <Link
          href={`/dashboard?lat=${item.latitude}&lng=${item.longitude}&city=${encodeURIComponent(item.city)}&country=${encodeURIComponent(item.country ?? "")}&photo=${encodeURIComponent(item.destination_image ?? "")}&fromWishlist=1`}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
        >
          <IoAirplane className="text-sm" />
          Planificar viaje
        </Link>
      </div>
    </div>
  );
}
