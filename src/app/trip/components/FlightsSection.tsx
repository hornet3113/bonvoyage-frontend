"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  IoAirplane, IoSwapHorizontal, IoSearch, IoChevronDown,
  IoArrowForward, IoAdd, IoCheckmark, IoCalendarOutline,
} from "react-icons/io5";
import type { TripDay } from "../types";

import { createApiClient, BACKEND } from "@/lib/api";
import MaintenanceView from "./MaintenanceView";

type TripType = "ida-vuelta" | "solo-ida" | "multidestino";

type Tramo = {
  origen: string | null;
  destino: string | null;
  salida: string | null;
  llegada: string | null;
  duracionMin: number | null;
  escalas: number | null;
  aerolinea: string | null;
};

type Vuelo = {
  id: string | null;
  precio: number | null;
  precioTexto: string | null;
  origen: string | null;
  destino: string | null;
  salida: string | null;
  llegada: string | null;
  duracionMin: number | null;
  escalas: number | null;
  aerolinea: string | null;
  tramos: Tramo[];
};

type Destination = {
  name: string;
  country: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
};

type Props = {
  destination: Destination;
  tripId?: string;
  tripDays?: TripDay[];
  defaultOrigin?: string;
  defaultDepartDate?: string;
  defaultReturnDate?: string;
  defaultPassengers?: number;
  defaultCabinClass?: string;
  onFlightSave?: (info: { airline: string; origin: string | null; destination: string | null; departure: string | null; price: number | null }) => void;
};

function formatDuration(min: number | null) {
  if (!min) return "";
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function formatTime(iso: string | null) {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

async function resolveLocation(query: string, token: string) {
  const res = await fetch(
    `${BACKEND}/api/v1/flights/location?query=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`No se encontró "${query}"`);
  const data = await res.json();
  // response shape: { success, data: { status, timestamp, data: [...] } }
  const places: any[] = data?.data?.data ?? data?.data ?? [];
  if (!Array.isArray(places) || places.length === 0)
    throw new Error(`No se encontró "${query}"`);
  // prefer CITY, then AIRPORT, then anything
  const match =
    places.find((p: any) => p.navigation?.entityType === "CITY") ??
    places.find((p: any) => p.navigation?.entityType === "AIRPORT") ??
    places[0];
  const skyId = match?.skyId;
  const entityId = match?.entityId;
  if (!skyId || !entityId) throw new Error(`No se pudo resolver el ID de "${query}"`);
  return { skyId, entityId };
}

export default function FlightsSection({
  destination,
  tripId,
  tripDays = [],
  defaultOrigin = "",
  defaultDepartDate = "",
  defaultReturnDate = "",
  defaultPassengers = 1,
  defaultCabinClass = "economy",
  onFlightSave,
}: Props) {
  const { getToken } = useAuth();

    function toISO(dt: string | null | undefined): string {
    if (!dt) return new Date().toISOString();
    const d = new Date(dt);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  async function handleSaveFlight(vuelo: Vuelo, dayId: string) {
    if (!tripId) return;
    if (dayId.startsWith("placeholder-")) return;
    const api = createApiClient(getToken);
    const firstLeg = vuelo.tramos?.[0];
    const saved = await api.post<{ reference_id: string }>("/api/v1/flights/save", {
      external_flight_id: vuelo.id ?? crypto.randomUUID(),
      airline_code: (firstLeg?.aerolinea ?? vuelo.aerolinea ?? "UNKNOWN").substring(0, 10),
      flight_number: (vuelo.id ?? "N/A").substring(0, 20),
      origin_airport: (firstLeg?.origen ?? vuelo.origen ?? "UNK").substring(0, 10),
      destination_airport: (firstLeg?.destino ?? vuelo.destino ?? "UNK").substring(0, 10),
      departure_time: toISO(firstLeg?.salida ?? vuelo.salida),
      arrival_time: toISO(firstLeg?.llegada ?? vuelo.llegada),
      price: vuelo.precio ?? 0,
      currency: "USD",
      api_source: "air-scrapper",
    });
    await api.post(`/api/v1/trips/${tripId}/days/${dayId}/items`, {
      item_type: "FLIGHT",
      flight_reference_id: saved.reference_id,
      estimated_cost: vuelo.precio != null ? Number(vuelo.precio) : undefined,
      notes: "Vuelo",
    });
    onFlightSave?.({
      airline: firstLeg?.aerolinea ?? vuelo.aerolinea ?? "Aerolínea",
      origin: firstLeg?.origen ?? vuelo.origen ?? null,
      destination: firstLeg?.destino ?? vuelo.destino ?? null,
      departure: firstLeg?.salida ?? vuelo.salida ?? null,
      price: vuelo.precio ?? null,
    });
  }
  const [tripType, setTripType] = useState<TripType>("ida-vuelta");
  const [origin, setOrigin] = useState(defaultOrigin);
  const [dest, setDest] = useState(
    destination.country ? `${destination.name}, ${destination.country}` : destination.name
  );
  const [departDate, setDepartDate] = useState(defaultDepartDate);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);
  const [passengers, setPassengers] = useState(defaultPassengers);
  const [cabinClass, setCabinClass] = useState(defaultCabinClass);

  const [vuelos, setVuelos] = useState<Vuelo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function swapLocations() {
    setOrigin(dest);
    setDest(origin);
  }

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setVuelos([]);
    setSearched(false);

    try {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");

      const [originData, destData] = await Promise.all([
        resolveLocation(origin, token),
        resolveLocation(dest, token),
      ]);

      const params = new URLSearchParams({
        originSkyId:        originData.skyId,
        originEntityId:     originData.entityId,
        destinationSkyId:   destData.skyId,
        destinationEntityId: destData.entityId,
        date:               departDate,
        adults:             passengers.toString(),
        cabinClass,
      });
      if (tripType === "ida-vuelta" && returnDate) {
        params.set("returnDate", returnDate);
      }

      const api = createApiClient(getToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await api.get<any>(`/api/v1/flights/search?${params}`);
      setVuelos(data.data?.vuelos ?? []);
      setSearched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al buscar vuelos");
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  // ── MANTENIMIENTO ─────────────────────────────────────────────────────────
  // Quita este return cuando la API de vuelos vuelva a estar disponible
  return (
    <MaintenanceView
      accent="blue"
      title="Búsqueda de vuelos no disponible"
      description="Estamos trabajando con nuestro proveedor para restablecer la búsqueda de vuelos. Pronto podrás explorar y comparar vuelos desde aquí."
    />
  );
  // ── FIN MANTENIMIENTO ──────────────────────────────────────────────────────
}

function FlightCard({
  vuelo,
  tripDays,
  onSaveToDay,
}: {
  vuelo: Vuelo;
  tripDays?: TripDay[];
  onSaveToDay?: (vuelo: Vuelo, dayId: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedDayId, setSavedDayId] = useState<string | null>(null);

  async function handleAddToDay(dayId: string) {
    if (!onSaveToDay) return;
    if (dayId.startsWith("placeholder-")) return;
    setSaving(true);
    try {
      await onSaveToDay(vuelo, dayId);
      setSavedDayId(dayId);
    } catch {
      // silent
    } finally {
      setSaving(false);
      setPickerOpen(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Airline */}
          <div className="w-24 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{vuelo.aerolinea ?? "Aerolínea"}</p>
            <p className="text-[10px] text-gray-400">
              {vuelo.escalas === 0 ? "Directo" : `${vuelo.escalas} escala${vuelo.escalas !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Route */}
          <div className="flex-1 flex items-center gap-3">
            <div className="text-right">
              <p className="text-lg font-bold text-gray-800">{formatTime(vuelo.salida)}</p>
              <p className="text-xs text-gray-400">{vuelo.origen ?? ""}</p>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1">
              <p className="text-[10px] text-gray-400">{formatDuration(vuelo.duracionMin)}</p>
              <div className="w-full flex items-center gap-1">
                <div className="flex-1 h-px bg-gray-200" />
                <IoArrowForward className="text-gray-300 text-xs flex-shrink-0" />
              </div>
            </div>

            <div>
              <p className="text-lg font-bold text-gray-800">{formatTime(vuelo.llegada)}</p>
              <p className="text-xs text-gray-400">{vuelo.destino ?? ""}</p>
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-bold text-blue-600">
              {vuelo.precioTexto ?? (vuelo.precio ? `$${vuelo.precio}` : "—")}
            </p>
            <p className="text-[10px] text-gray-400">por persona</p>
          </div>
        </div>
      </button>

      {/* Tramos detail */}
      {expanded && vuelo.tramos.length > 1 && (
        <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 space-y-2">
          {vuelo.tramos.map((tramo, i) => (
            <div key={i} className="flex items-center gap-3 text-xs text-gray-600">
              <IoAirplane className="text-blue-400 flex-shrink-0" />
              <span className="font-medium">{tramo.aerolinea}</span>
              <span>{formatTime(tramo.salida)} · {tramo.origen}</span>
              <IoArrowForward className="text-gray-300" />
              <span>{formatTime(tramo.llegada)} · {tramo.destino}</span>
              <span className="text-gray-400 ml-auto">{formatDuration(tramo.duracionMin)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add to itinerary — always visible when tripId is set */}
      {onSaveToDay && (
        <div className="border-t border-gray-100 px-5 py-3">
          {savedDayId ? (
            <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
              <IoCheckmark className="text-sm" />
              Vuelo añadido al itinerario
            </div>
          ) : !pickerOpen ? (
            <button
              onClick={(e) => { e.stopPropagation(); setPickerOpen(true); }}
              className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <IoAdd className="text-sm" />
              Agregar al itinerario
            </button>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <IoCalendarOutline className="text-xs" />
                Selecciona el día
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(tripDays ?? []).filter((d) => !d.dayId.startsWith("placeholder-")).length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">Cargando días del viaje...</p>
                ) : (
                  (tripDays ?? [])
                    .filter((d) => !d.dayId.startsWith("placeholder-"))
                    .map((d) => (
                      <button
                        key={d.dayId}
                        onClick={() => handleAddToDay(d.dayId)}
                        disabled={saving}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? "..." : `Día ${d.dayNumber}`}
                      </button>
                    ))
                )}
                <button
                  onClick={() => setPickerOpen(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
