"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@clerk/nextjs";
import {
  IoStar, IoLocationSharp, IoCompass, IoPricetag,
  IoSearch, IoAdd, IoCheckmark, IoCalendarOutline,
  IoTimeOutline, IoClose,
} from "react-icons/io5";
import type { ItineraryItem, TripDay } from "../types";

const POIMap = dynamic(() => import("./POIMap"), { ssr: false });

type POI = {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  ratingCount: number | null;
  priceLevel: string | null;
  description: string | null;
  photoUrl: string | null;
  lat: number;
  lng: number;
  isOpenNow?: boolean | null;
  todayHours?: string | null;
  weeklyHours?: string[] | null;
};

type Destination = {
  name: string;
  country: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
};

type AddOptions = { start_time?: string; end_time?: string; notes?: string };

type Props = {
  destination: Destination;
  tripDays?: TripDay[];
  onAddToItinerary: (item: ItineraryItem, dayNumber: number, options?: AddOptions) => void;
  readOnly?: boolean;
};

import { createApiClient } from "@/lib/api";

export default function PointsOfInterestSection({
  destination,
  tripDays,
  onAddToItinerary,
  readOnly = false,
}: Props) {
  const { getToken } = useAuth();
  const days: TripDay[] = tripDays ?? [];
  const [places, setPlaces] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [detailPickerOpen, setDetailPickerOpen] = useState(false);
  const [addStartTime, setAddStartTime] = useState("");
  const [addEndTime, setAddEndTime] = useState("");
  const [addNote, setAddNote] = useState("");
  const [showHours, setShowHours] = useState(false);
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPOIs() {
      setLoading(true);
      const api = createApiClient(getToken);
      try {
        const data = await api.get<{ places?: POI[] }>(
          `/api/v1/poi?lat=${destination.lat}&lng=${destination.lng}`
        );
        setPlaces(data.places ?? []);
        if (data.places && data.places.length > 0) setSelectedId(data.places[0].id);
      } catch {
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPOIs();
  }, [destination.lat, destination.lng]);

  const filtered = useMemo(() => {
    if (!query.trim()) return places;
    const q = query.toLowerCase();
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
    );
  }, [places, query]);

  const selectedPlace =
    filtered.find((p) => p.id === selectedId) ??
    places.find((p) => p.id === selectedId) ??
    null;

  function buildItem(poi: POI): ItineraryItem {
    return {
      id: poi.id,
      type: "poi",
      name: poi.name,
      address: poi.address,
      lat: poi.lat,
      lng: poi.lng,
      photoUrl: poi.photoUrl,
      rating: poi.rating,
      priceLevel: poi.priceLevel,
      description: poi.description,
      isOpenNow: poi.isOpenNow,
      todayHours: poi.todayHours,
      weeklyHours: poi.weeklyHours,
    };
  }

  function handleAddToDay(poi: POI, day: number) {
    onAddToItinerary(buildItem(poi), day);
    setAddedIds((prev) => new Set(prev).add(poi.id));
    setPickerOpenId(null);
    setDetailPickerOpen(false);
  }

  function handleDetailAddToDay(poi: POI, day: number) {
    onAddToItinerary(buildItem(poi), day, {
      start_time: addStartTime || undefined,
      end_time: addEndTime || undefined,
      notes: addNote || undefined,
    });
    setAddedIds((prev) => new Set(prev).add(poi.id));
    setDetailPickerOpen(false);
    setAddStartTime("");
    setAddEndTime("");
    setAddNote("");
    setShowHours(false);
  }

  function selectPlace(id: string) {
    setSelectedId(id);
    setPickerOpenId(null);
    setDetailPickerOpen(false);
    setAddStartTime("");
    setAddEndTime("");
    setAddNote("");
    setShowHours(false);
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] gap-3 text-gray-400">
        <IoCompass className="text-4xl animate-spin" />
        <span className="text-sm">Buscando puntos de interés...</span>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-gray-400">
        <IoCompass className="text-6xl text-gray-200" />
        <p className="text-sm">No se encontraron puntos de interés cerca de {destination.name}.</p>
      </div>
    );
  }

  // ── Main layout ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">

      {/* ── Top bar: search + count ── */}
      <div className="px-6 max-w-6xl mx-auto w-full pt-5 pb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar lugar o atracción…"
            className="w-full pl-10 pr-10 py-2.5 rounded-full border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <IoClose className="text-sm" />
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {filtered.length} {filtered.length === 1 ? "lugar" : "lugares"}
        </span>
      </div>

      {/* ── Body: cards + map ── */}
      <div className="flex-1 min-h-0 px-6 max-w-6xl mx-auto w-full pb-5">
        <div className="flex gap-5 h-full">

          {/* Cards — scrollable list */}
          <div className="flex-1 min-w-0 overflow-y-auto pr-1 scrollbar-hide">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400 mt-8">
                <IoCompass className="text-4xl text-gray-200" />
                <p className="text-sm text-center">Sin resultados para &ldquo;{query}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 pb-4">
                {filtered.map((poi) => (
                  <POICard
                    key={poi.id}
                    poi={poi}
                    days={days}
                    selected={selectedId === poi.id}
                    added={addedIds.has(poi.id)}
                    pickerOpen={pickerOpenId === poi.id}
                    onClick={() => selectPlace(poi.id)}
                    onPickerToggle={() =>
                      setPickerOpenId(pickerOpenId === poi.id ? null : poi.id)
                    }
                    onAddToDay={(day) => handleAddToDay(poi, day)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right column: map + detail card */}
          <div className="w-[420px] flex-shrink-0 flex flex-col gap-3 h-full">

            {/* Map — takes all available height */}
            <div className="flex-1 min-h-0 rounded-2xl overflow-hidden shadow-md border border-gray-100">
              <POIMap
                places={filtered}
                selectedId={selectedId}
                onSelectId={(id) => selectPlace(id)}
                center={{ lat: destination.lat, lng: destination.lng }}
              />
            </div>

            {/* Detail card — compact, shown when a place is selected */}
            {selectedPlace && (
              <div className="flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">

                {/* Photo strip + close */}
                {selectedPlace.photoUrl && (
                  <div className="relative w-full h-32 overflow-hidden">
                    <img
                      src={selectedPlace.photoUrl}
                      alt={selectedPlace.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedPlace.isOpenNow != null && (
                      <span
                        className={`absolute top-2 left-2 text-[9px] font-semibold px-2 py-0.5 rounded-full shadow ${
                          selectedPlace.isOpenNow
                            ? "bg-green-500 text-white"
                            : "bg-gray-800/70 text-white"
                        }`}
                      >
                        {selectedPlace.isOpenNow ? "Abierto" : "Cerrado"}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-3 space-y-2">
                  {/* Name */}
                  <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                    {selectedPlace.name}
                  </h3>

                  {/* Rating + price */}
                  <div className="flex items-center gap-3">
                    {selectedPlace.rating && (
                      <div className="flex items-center gap-1">
                        <IoStar className="text-amber-400 text-xs" />
                        <span className="text-xs font-semibold text-gray-700">
                          {selectedPlace.rating.toFixed(1)}
                        </span>
                        {selectedPlace.ratingCount && (
                          <span className="text-[10px] text-gray-400">
                            (
                            {selectedPlace.ratingCount > 999
                              ? `${(selectedPlace.ratingCount / 1000).toFixed(1)}k`
                              : selectedPlace.ratingCount}
                            )
                          </span>
                        )}
                      </div>
                    )}
                    {selectedPlace.priceLevel && (
                      <div className="flex items-center gap-0.5 text-gray-500">
                        <IoPricetag className="text-[10px]" />
                        <span className="text-xs">{selectedPlace.priceLevel}</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-1.5">
                    <IoLocationSharp className="text-blue-400 text-xs flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-500 line-clamp-1">{selectedPlace.address}</p>
                  </div>

                  {/* Hours */}
                  {selectedPlace.todayHours && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <IoTimeOutline className="flex-shrink-0 text-gray-400" />
                      <span>{selectedPlace.todayHours}</span>
                      {selectedPlace.weeklyHours && selectedPlace.weeklyHours.length > 0 && (
                        <button
                          onClick={() => setShowHours((v) => !v)}
                          className="text-blue-500 hover:text-blue-700 ml-1"
                        >
                          {showHours ? "menos" : "ver semana"}
                        </button>
                      )}
                    </div>
                  )}
                  {showHours && selectedPlace.weeklyHours && (
                    <ul className="pl-5 space-y-0.5">
                      {selectedPlace.weeklyHours.map((line, i) => (
                        <li key={i} className="text-[9px] text-gray-500">{line}</li>
                      ))}
                    </ul>
                  )}

                  {/* Action */}
                  {readOnly ? (
                    <div className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200">
                      Viaje confirmado — solo lectura
                    </div>
                  ) : !detailPickerOpen ? (
                    <button
                      onClick={() => setDetailPickerOpen(true)}
                      className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        addedIds.has(selectedPlace.id)
                          ? "bg-green-50 text-green-600 border border-green-200"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {addedIds.has(selectedPlace.id) ? (
                        <><IoCheckmark className="text-sm" /> Añadido al itinerario</>
                      ) : (
                        <><IoCalendarOutline className="text-sm" /> Añadir a mi día</>
                      )}
                    </button>
                  ) : (
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-2 space-y-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                        Selecciona el día
                      </p>
                      <div className="grid grid-cols-5 gap-1">
                        {days.map((d) => (
                          <button
                            key={d.dayId}
                            onClick={() => handleDetailAddToDay(selectedPlace, d.dayNumber)}
                            className="text-xs font-medium text-gray-700 hover:bg-blue-500 hover:text-white rounded-lg py-1.5 transition-colors bg-white border border-gray-200"
                          >
                            {d.dayNumber}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <div className="flex-1">
                          <label className="text-[9px] text-gray-400 uppercase tracking-wide block mb-0.5">
                            Inicio
                          </label>
                          <input
                            type="time"
                            value={addStartTime}
                            onChange={(e) => setAddStartTime(e.target.value)}
                            className="w-full text-[10px] border border-gray-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] text-gray-400 uppercase tracking-wide block mb-0.5">
                            Fin
                          </label>
                          <input
                            type="time"
                            value={addEndTime}
                            onChange={(e) => setAddEndTime(e.target.value)}
                            className="w-full text-[10px] border border-gray-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
                          />
                        </div>
                      </div>
                      <textarea
                        value={addNote}
                        onChange={(e) => setAddNote(e.target.value)}
                        placeholder="Nota opcional…"
                        rows={2}
                        className="w-full text-[10px] border border-gray-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none bg-white"
                      />
                      <button
                        onClick={() => setDetailPickerOpen(false)}
                        className="w-full text-[10px] text-gray-400 hover:text-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── POI Card ─────────────────────────────────────────────────────────────────
function POICard({
  poi,
  days,
  selected,
  added,
  pickerOpen,
  onClick,
  onPickerToggle,
  onAddToDay,
}: {
  poi: POI;
  days: TripDay[];
  selected: boolean;
  added: boolean;
  pickerOpen: boolean;
  onClick: () => void;
  onPickerToggle: () => void;
  onAddToDay: (day: number) => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative w-full bg-white rounded-2xl overflow-hidden shadow-sm border cursor-pointer group transition-all duration-200 ${
        selected
          ? "border-blue-500 shadow-lg ring-2 ring-blue-100"
          : "border-gray-100 hover:border-gray-200 hover:shadow-md"
      }`}
    >
      {/* ── Image section ── */}
      <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
        {poi.photoUrl ? (
          <img
            src={poi.photoUrl}
            alt={poi.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <IoCompass className="text-4xl text-gray-200" />
          </div>
        )}

        {/* Rating — top left */}
        {poi.rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
            <IoStar className="text-amber-400 text-[10px]" />
            <span className="text-[11px] font-bold text-gray-800">{poi.rating.toFixed(1)}</span>
            {poi.ratingCount && (
              <span className="text-[9px] text-gray-500">
                ({poi.ratingCount > 999
                  ? `${(poi.ratingCount / 1000).toFixed(1)}k`
                  : poi.ratingCount})
              </span>
            )}
          </div>
        )}

        {/* Add button — top right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPickerToggle();
          }}
          title="Agregar al itinerario"
          className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-colors ${
            added
              ? "bg-green-500 text-white"
              : "bg-white/90 text-blue-500 hover:bg-blue-50"
          }`}
        >
          {added ? <IoCheckmark className="text-xs" /> : <IoAdd className="text-sm" />}
        </button>

        {/* Day picker popover */}
        {pickerOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-10 right-2 z-20 bg-white rounded-xl shadow-lg border border-gray-100 p-2 w-36"
          >
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">
              Agregar al día
            </p>
            <div className="grid grid-cols-4 gap-1">
              {days.map((d) => (
                <button
                  key={d.dayId}
                  onClick={() => onAddToDay(d.dayNumber)}
                  className="text-[11px] font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg py-1 transition-colors"
                >
                  {d.dayNumber}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Info section — bottom white area (like reference card) ── */}
      <div className="p-3 space-y-1.5">
        {/* Name */}
        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">
          {poi.name}
        </h3>

        {/* Location row */}
        <div className="flex items-center gap-1.5">
          <IoLocationSharp className="text-blue-500 text-xs flex-shrink-0" />
          <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed">
            {poi.address}
          </p>
        </div>

        {/* Bottom meta row */}
        <div className="flex items-center justify-between pt-0.5">
          {/* Open/closed pill */}
          {poi.isOpenNow != null ? (
            <span
              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                poi.isOpenNow
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {poi.isOpenNow ? "Abierto" : "Cerrado"}
            </span>
          ) : (
            <span />
          )}

          {/* Price level */}
          {poi.priceLevel && (
            <div className="flex items-center gap-0.5 text-gray-400">
              <IoPricetag className="text-[9px]" />
              <span className="text-[10px] font-medium">{poi.priceLevel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
