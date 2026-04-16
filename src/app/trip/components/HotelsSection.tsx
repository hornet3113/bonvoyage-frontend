"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@clerk/nextjs";
import {
  IoBed,
  IoSearch,
  IoStar,
  IoLocationSharp,
  IoPricetag,
  IoPerson,
  IoCalendarOutline,
  IoCheckmark,
  IoAdd,
} from "react-icons/io5";

const POIMap = dynamic(() => import("./POIMap"), { ssr: false });

type Hotel = {
  id: string | null;
  name: string;
  price: string;
  rating: string | number;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Destination = {
  name: string;
  country: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
};


function toMapPlace(hotel: Hotel, index: number) {
  return {
    id: hotel.id ?? `hotel-${index}`,
    name: hotel.name,
    lat: hotel.latitude ?? 0,
    lng: hotel.longitude ?? 0,
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

import { createApiClient } from "@/lib/api";
import MaintenanceView from "./MaintenanceView";

type TripDay = { dayId: string; dayNumber: number; date: string };
type SavedHotelInfo = { name: string; imageUrl: string | null; price: string; externalId?: string };

export default function HotelsSection({
  destination,
  tripId,
  tripDays = [],
  savedHotelExternalId = null,
  onHotelSave,
}: {
  destination: Destination;
  tripId?: string;
  tripDays?: TripDay[];
  savedHotelExternalId?: string | null;
  onHotelSave?: (hotel: SavedHotelInfo) => void;
}) {
  const { getToken } = useAuth();
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(tomorrow());
  const [adults, setAdults] = useState(1);
  const [rooms, setRooms] = useState(1);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(savedHotelExternalId ?? null);
  // días que cubre el hotel según check-in / check-out
  function getMatchingDays(): TripDay[] {
    if (!tripDays.length) return [];
    const matching = tripDays.filter(
      (d) => d.date && d.date >= checkIn && d.date < checkOut
    );
    if (matching.length > 0) return matching;
    // fallback: día más cercano al check-in
    const sorted = [...tripDays].sort((a, b) => a.date.localeCompare(b.date));
    return [sorted[0]];
  }

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHotels([]);
    setSelectedId(null);

    const api = createApiClient(getToken);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const destData = await api.get<any>(`/api/v1/destinations/search?query=${encodeURIComponent(destination.name)}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const places: any[] = destData?.data?.data ?? destData?.data ?? (Array.isArray(destData) ? destData : []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const match =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        places.find((p: any) => p.navigation?.entityType === "CITY") ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        places.find((p: any) => p.navigation?.entityType === "AIRPORT") ??
        places[0];
      if (!match) throw new Error("Destino no encontrado");

      const params = new URLSearchParams({
        destination: match.entityId,
        checkin: checkIn,
        checkout: checkOut,
        adults: adults.toString(),
        rooms: rooms.toString(),
        currency: "USD",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await api.get<any>(`/api/v1/hotels/search?${params}`);
      const list: Hotel[] = data.data ?? [];
      setHotels(list);
      if (list.length > 0) setSelectedId(list[0].id ?? "hotel-0");
      setSearched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al buscar hoteles");
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToItinerary() {
    if (!selectedHotel || !tripId) return;
    setSaving(true);
    const api = createApiClient(getToken);
    try {
      await api.post("/api/v1/hotels/save", {
        id: selectedHotel.id ?? `hotel-${selectedHotel.name}`,
        name: selectedHotel.name,
        latitude: selectedHotel.latitude ?? 0,
        longitude: selectedHotel.longitude ?? 0,
        rating: typeof selectedHotel.rating === "number" ? selectedHotel.rating : null,
        imageUrl: selectedHotel.imageUrl ?? null,
        price: parseFloat(String(selectedHotel.price).replace(/[^0-9.]/g, "")) || 0,
        trip_id: tripId,
      });
      setSavedId(selectedHotel.id ?? selectedId);
      onHotelSave?.({ name: selectedHotel.name, imageUrl: selectedHotel.imageUrl, price: selectedHotel.price, externalId: selectedHotel.id ?? undefined });
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  const selectedHotel =
    hotels.find((h, i) => (h.id ?? `hotel-${i}`) === selectedId) ?? null;

  const mapPlaces = hotels
    .filter((h) => h.latitude && h.longitude)
    .map(toMapPlace);

  // ── MANTENIMIENTO ─────────────────────────────────────────────────────────
  // Quita este return cuando la API de hoteles vuelva a estar disponible
  return (
    <MaintenanceView
      accent="purple"
      title="Búsqueda de hospedajes no disponible"
      description="Estamos trabajando con nuestro proveedor para restablecer la búsqueda de hoteles. Pronto podrás explorar opciones de hospedaje desde aquí."
    />
  );
  // ── FIN MANTENIMIENTO ──────────────────────────────────────────────────────
}

function HotelCard({
  hotel,
  selected,
  onClick,
}: {
  hotel: Hotel;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative w-full bg-white rounded-xl overflow-hidden shadow-sm border transition-all duration-200 cursor-pointer ${
        selected
          ? "border-blue-500 shadow-md ring-1 ring-blue-200"
          : "border-gray-100 hover:border-gray-300 hover:shadow"
      }`}
    >
      {/* Image */}
      <div className="w-full h-28 bg-gray-100 overflow-hidden">
        {hotel.imageUrl ? (
          <img src={hotel.imageUrl} alt={hotel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <IoBed className="text-3xl text-gray-200" />
          </div>
        )}
      </div>

      <div className="p-2.5">
        {/* precio */}
        <div className="flex items-center justify-between mb-1">
          {hotel.rating && hotel.rating !== "N/A" ? (
            <div className="flex items-center gap-1">
              <IoStar className="text-amber-400 text-[10px]" />
              <span className="text-[11px] font-semibold text-gray-700">{hotel.rating}</span>
            </div>
          ) : <span />}

          {hotel.price && hotel.price !== "Precio no disponible" && (
            <div className="flex items-center gap-0.5 text-blue-500">
              <IoPricetag className="text-[9px]" />
              <span className="text-[10px] font-semibold">{hotel.price}</span>
            </div>
          )}
        </div>

    
        <h3 className="font-semibold text-gray-800 text-xs leading-tight line-clamp-2">
          {hotel.name}
        </h3>
      </div>
    </div>
  );
}
