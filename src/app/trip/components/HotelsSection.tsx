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

  return (
    <div className="px-4 max-w-6xl mx-auto pt-6 pb-8 space-y-5">

      {/* Formulario de búsqueda */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <IoLocationSharp className="text-xs" /> Destino
            </label>
            <div className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600 truncate">
              {destination.name}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <IoCalendarOutline className="text-xs" /> Entrada
            </label>
            <input
              type="date" value={checkIn} min={today()}
              onChange={(e) => setCheckIn(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <IoCalendarOutline className="text-xs" /> Salida
            </label>
            <input
              type="date" value={checkOut} min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <IoPerson className="text-xs" /> Adultos
              </label>
              <input type="number" min={1} max={10} value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <IoBed className="text-xs" /> Hab.
              </label>
              <input type="number" min={1} max={10} value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors">
            {loading ? <IoBed className="text-base animate-pulse" /> : <IoSearch className="text-base" />}
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </form>

      {/* Error — mantenimiento */}
      {error && (
        <MaintenanceView
          accent="purple"
          title="Búsqueda de hospedajes no disponible"
          description="Estamos trabajando con nuestro proveedor para restablecer la búsqueda de hoteles. Pronto podrás explorar opciones de hospedaje desde aquí."
        />
      )}

      {/* Estado inicial */}
      {!searched && !loading && !error && (
        <div className="flex flex-col items-center justify-center h-60 gap-3 text-gray-400">
          <IoBed className="text-5xl text-gray-200" />
          <p className="text-sm">Ingresa las fechas para buscar hospedajes en {destination.name}.</p>
        </div>
      )}

      {/* Sin resultados */}
      {searched && !loading && hotels.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center h-60 gap-3 text-gray-400">
          <IoBed className="text-5xl text-gray-200" />
          <p className="text-sm">No se encontraron hoteles para esas fechas.</p>
        </div>
      )}

      {/* Resultados */}
      {hotels.length > 0 && (
        <div className="flex gap-4 items-start">
          {/* Lista */}
          <div className="flex-1 overflow-y-auto max-h-[540px] pr-1">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {hotels.map((hotel, i) => {
                const id = hotel.id ?? `hotel-${i}`;
                return (
                  <HotelCard
                    key={id}
                    hotel={hotel}
                    selected={selectedId === id}
                    onClick={() => setSelectedId(id)}
                  />
                );
              })}
            </div>
          </div>

          {/* Sidebar: mapa + detalle */}
          <div className="w-72 flex-shrink-0 sticky top-16 h-[540px] flex flex-col gap-3">
            {/* Mapa */}
            <div className="h-[220px] rounded-2xl overflow-hidden shadow-md border border-gray-100 flex-shrink-0">
              {mapPlaces.length > 0 ? (
                <POIMap
                  places={mapPlaces}
                  selectedId={selectedId}
                  onSelectId={setSelectedId}
                  center={{ lat: destination.lat, lng: destination.lng }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <IoLocationSharp className="text-3xl text-gray-200" />
                </div>
              )}
            </div>

            {/* Panel detalle */}
            <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm min-h-0">
              {selectedHotel ? (
                <HotelDetailPanel
                  hotel={selectedHotel}
                  selectedId={selectedId}
                  tripId={tripId}
                  tripDays={tripDays}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  saving={saving}
                  savedId={savedId}
                  getMatchingDays={getMatchingDays}
                  onSave={handleSaveToItinerary}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
                  <IoBed className="text-3xl text-gray-200" />
                  <p className="text-xs text-center text-gray-400">
                    Selecciona un hotel para ver sus detalles
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
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

function HotelDetailPanel({
  hotel,
  tripId,
  checkIn,
  checkOut,
  saving,
  savedId,
  getMatchingDays,
  onSave,
}: {
  hotel: Hotel;
  selectedId: string | null;
  tripId?: string;
  tripDays: TripDay[];
  checkIn: string;
  checkOut: string;
  saving: boolean;
  savedId: string | null;
  getMatchingDays: () => TripDay[];
  onSave: () => Promise<void>;
}) {
  const isSaved = savedId !== null && (savedId === hotel.id || savedId === hotel.name);
  const matchingDays = getMatchingDays();

  return (
    <div className="flex flex-col h-full">
      {/* Image */}
      <div className="w-full h-32 bg-gray-100 flex-shrink-0 overflow-hidden">
        {hotel.imageUrl ? (
          <img src={hotel.imageUrl} alt={hotel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <IoBed className="text-4xl text-gray-200" />
          </div>
        )}
      </div>

      <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto">
        {/* Rating + Price */}
        <div className="flex items-center justify-between">
          {hotel.rating && hotel.rating !== "N/A" ? (
            <div className="flex items-center gap-1">
              <IoStar className="text-amber-400 text-xs" />
              <span className="text-xs font-semibold text-gray-700">{hotel.rating}</span>
            </div>
          ) : <span />}
          {hotel.price && hotel.price !== "Precio no disponible" && (
            <div className="flex items-center gap-1 text-blue-500">
              <IoPricetag className="text-xs" />
              <span className="text-xs font-semibold">{hotel.price}</span>
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="font-bold text-gray-800 text-sm leading-tight">{hotel.name}</h3>

        {/* Dates */}
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <IoCalendarOutline className="text-xs" />
          <span>{checkIn}</span>
          <span>→</span>
          <span>{checkOut}</span>
        </div>

        {/* Coordinates */}
        {hotel.latitude && hotel.longitude && (
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <IoLocationSharp className="text-xs" />
            <span>{hotel.latitude.toFixed(4)}, {hotel.longitude.toFixed(4)}</span>
          </div>
        )}

        {/* Matching days */}
        {matchingDays.length > 0 && (
          <div className="text-[11px] text-gray-500">
            Cubre {matchingDays.length === 1
              ? `el día ${matchingDays[0].dayNumber}`
              : `los días ${matchingDays[0].dayNumber}–${matchingDays[matchingDays.length - 1].dayNumber}`}
          </div>
        )}

        {/* Save button */}
        {tripId && (
          <button
            onClick={onSave}
            disabled={saving || isSaved}
            className={`mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
              isSaved
                ? "bg-green-50 text-green-600 border border-green-200 cursor-default"
                : "bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white"
            }`}
          >
            {isSaved ? (
              <><IoCheckmark className="text-sm" /> Guardado</>
            ) : saving ? (
              <><IoAdd className="text-sm animate-spin" /> Guardando...</>
            ) : (
              <><IoAdd className="text-sm" /> Agregar al itinerario</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
