"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@clerk/nextjs";
import {
  IoStar, IoLocationSharp, IoCompass, IoPricetag, IoSearch,
  IoAdd, IoCheckmark, IoCalendarOutline, IoTimeOutline,
  IoGrid, IoClose, IoSwapVertical,
} from "react-icons/io5";
import {
  IoLibraryOutline, IoLeafOutline, IoFlagOutline, IoWaterOutline, IoMoonOutline,
} from "react-icons/io5";
import type { ItineraryItem, TripDay } from "../types";
import TimePicker from "./TimePicker";
import { SkeletonCard } from "./SkeletonCard";

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

// ── Category definitions ──────────────────────────────────────────────────────
type CategoryId = "todos" | "museos" | "parques" | "monumentos" | "playas" | "vida-nocturna";

const CATEGORIES: { id: CategoryId; label: string; Icon: React.ElementType; color: string }[] = [
  { id: "todos",         label: "Todos",         Icon: IoGrid,          color: "#6B7280" },
  { id: "museos",        label: "Museos",         Icon: IoLibraryOutline, color: "#8B5CF6" },
  { id: "parques",       label: "Parques",        Icon: IoLeafOutline,   color: "#10B981" },
  { id: "monumentos",    label: "Monumentos",     Icon: IoFlagOutline,   color: "#F59E0B" },
  { id: "playas",        label: "Playas",         Icon: IoWaterOutline,  color: "#3B82F6" },
  { id: "vida-nocturna", label: "Vida nocturna",  Icon: IoMoonOutline,   color: "#EC4899" },
];

const CATEGORY_PIN_COLORS: Record<CategoryId, string> = {
  todos:         "#EF4444",
  museos:        "#8B5CF6",
  parques:       "#10B981",
  monumentos:    "#F59E0B",
  playas:        "#3B82F6",
  "vida-nocturna": "#EC4899",
};

function detectCategory(poi: POI): CategoryId {
  const text = `${poi.name} ${poi.description ?? ""}`.toLowerCase();
  if (/playa|beach|costa|bahía|bay|arena|surf/.test(text))                                   return "playas";
  if (/museo|museum|galería|gallery|arte\b|art\b|exhibición|exposición/.test(text))          return "museos";
  if (/parque|park|jardín|garden|bosque|naturaleza|reserva|nature/.test(text))               return "parques";
  if (/monumento|monument|memorial|statue|estatua|histórico|historic|ruina|ruin/.test(text)) return "monumentos";
  if (/bar\b|club|discoteca|nightclub|pub|lounge|nocturna|nightlife|cantina/.test(text))     return "vida-nocturna";
  return "todos";
}

type SortBy = "rating" | "name";

// ─────────────────────────────────────────────────────────────────────────────

export default function PointsOfInterestSection({ destination, tripDays, onAddToItinerary, readOnly = false }: Props) {
  const { getToken } = useAuth();
  const days: TripDay[] = tripDays ?? [];
  const [places, setPlaces] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("bv-poi-category") as CategoryId) ?? "todos";
    }
    return "todos";
  });
  const [sortBy, setSortBy] = useState<SortBy>("rating");
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [detailPickerOpen, setDetailPickerOpen] = useState(false);
  const [addStartTime, setAddStartTime] = useState("");
  const [addEndTime, setAddEndTime] = useState("");
  const [addNote, setAddNote] = useState("");
  const [showHours, setShowHours] = useState(false);

  useEffect(() => {
    async function fetchPOIs() {
      setLoading(true);
      const api = createApiClient(getToken);
      try {
        const data = await api.get<{ places?: POI[] }>(`/api/v1/poi?lat=${destination.lat}&lng=${destination.lng}`);
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
    let list = places;

    if (activeCategory !== "todos") {
      list = list.filter((p) => detectCategory(p) === activeCategory);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === "name")   return a.name.localeCompare(b.name);
      return 0;
    });
  }, [places, query, activeCategory, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: places.length };
    for (const cat of CATEGORIES.slice(1)) {
      counts[cat.id] = places.filter((p) => detectCategory(p) === cat.id).length;
    }
    return counts;
  }, [places]);

  const pinColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of filtered) {
      const cat = detectCategory(p);
      map[p.id] = CATEGORY_PIN_COLORS[cat];
    }
    return map;
  }, [filtered]);

  const selectedPlace = filtered.find((p) => p.id === selectedId) ?? null;

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

  function handleCategoryChange(cat: CategoryId) {
    setActiveCategory(cat);
    localStorage.setItem("bv-poi-category", cat);
    setSelectedId(null);
    setDetailPickerOpen(false);
  }

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-4 max-w-6xl mx-auto pt-6 pb-8 space-y-4">
        <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="flex gap-4">
          <div className="flex-1 grid grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="w-72 flex-shrink-0 space-y-3">
            <div className="h-[240px] bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-[320px] bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 text-gray-400">
        <IoCompass className="text-5xl text-gray-200" />
        <p className="text-sm">No se encontraron puntos de interés cerca de {destination.name}.</p>
      </div>
    );
  }

  const activeCategoryData = CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className="px-4 max-w-6xl mx-auto pt-6 pb-8 space-y-4">

      {/* Search + Sort row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar lugar..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          />
        </div>

        {/* Sort dropdown */}
        <div className="relative flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 bg-white shadow-sm">
          <IoSwapVertical className="text-gray-400 text-sm flex-shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-xs text-gray-600 bg-transparent focus:outline-none cursor-pointer pr-1"
          >
            <option value="rating">Mayor rating</option>
            <option value="name">Nombre A–Z</option>
          </select>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(({ id, label, Icon, color }) => {
          const count = categoryCounts[id] ?? 0;
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              onClick={() => handleCategoryChange(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
                isActive
                  ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-500"
              }`}
            >
              <Icon className="text-sm flex-shrink-0" />
              {label}
              {count > 0 && (
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* Cards grid */}
        <div className="flex-1 lg:overflow-y-auto lg:max-h-[540px] pr-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-300">
              <IoCompass className="text-4xl" />
              <p className="text-sm text-gray-400 text-center">
                {query ? `Sin resultados para "${query}"` : "No hay lugares en esta categoría"}
              </p>
              {activeCategory !== "todos" && (
                <button
                  onClick={() => handleCategoryChange("todos")}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Ver todos los lugares
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((poi) => (
                <POICard
                  key={poi.id}
                  poi={poi}
                  days={days}
                  selected={selectedId === poi.id}
                  added={addedIds.has(poi.id)}
                  pickerOpen={pickerOpenId === poi.id}
                  onClick={() => selectPlace(poi.id)}
                  onPickerToggle={() => setPickerOpenId(pickerOpenId === poi.id ? null : poi.id)}
                  onAddToDay={(day) => handleAddToDay(poi, day)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right column: filter badge + map + detail panel */}
        <div className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-16 lg:h-[580px] flex flex-col gap-2">

          {/* Active filter badge */}
          {activeCategory !== "todos" && activeCategoryData && (
            <div
              className="flex-shrink-0 flex items-center justify-between px-2.5 py-1.5 rounded-lg border"
              style={{
                backgroundColor: `${activeCategoryData.color}15`,
                borderColor: `${activeCategoryData.color}40`,
              }}
            >
              <div className="flex items-center gap-1.5">
                <activeCategoryData.Icon className="text-xs" style={{ color: activeCategoryData.color }} />
                <span className="text-[10px] font-semibold" style={{ color: activeCategoryData.color }}>
                  {activeCategoryData.label} · {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button onClick={() => handleCategoryChange("todos")} className="text-gray-400 hover:text-gray-600">
                <IoClose className="text-xs" />
              </button>
            </div>
          )}

          {/* Map */}
          <div className="h-[240px] rounded-2xl overflow-hidden shadow-md border border-gray-100 flex-shrink-0">
            <POIMap
              places={filtered}
              selectedId={selectedId}
              onSelectId={(id) => selectPlace(id)}
              center={{ lat: destination.lat, lng: destination.lng }}
              colorMap={pinColorMap}
            />
          </div>

          {/* Detail panel */}
          <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm min-h-0">
            {selectedPlace ? (
              <>
                {/* Image with overlays */}
                <div className="relative w-full h-32 overflow-hidden rounded-t-2xl flex-shrink-0">
                  {selectedPlace.photoUrl ? (
                    <img src={selectedPlace.photoUrl} alt={selectedPlace.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <IoCompass className="text-3xl text-gray-300" />
                    </div>
                  )}
                  {selectedPlace.isOpenNow != null && (
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow ${
                      selectedPlace.isOpenNow ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}>
                      {selectedPlace.isOpenNow ? "Abierto" : "Cerrado"}
                    </span>
                  )}
                  {selectedPlace.rating && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <IoStar className="text-amber-400 text-[10px]" />
                      <span className="text-white text-[11px] font-bold">{selectedPlace.rating.toFixed(1)}</span>
                      {selectedPlace.ratingCount && (
                        <span className="text-white/70 text-[9px]">
                          ({selectedPlace.ratingCount > 999
                            ? `${(selectedPlace.ratingCount / 1000).toFixed(1)}k`
                            : selectedPlace.ratingCount})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <h3 className="font-bold text-gray-800 text-sm leading-snug">{selectedPlace.name}</h3>

                  {selectedPlace.priceLevel && (
                    <div className="flex items-center gap-0.5 text-gray-500">
                      <IoPricetag className="text-[10px]" />
                      <span className="text-xs">{selectedPlace.priceLevel}</span>
                    </div>
                  )}

                  {selectedPlace.description && (
                    <p className="text-xs text-gray-600 leading-relaxed">{selectedPlace.description}</p>
                  )}

                  <div className="flex items-start gap-1.5">
                    <IoLocationSharp className="text-gray-400 text-xs flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500">{selectedPlace.address}</p>
                  </div>

                  {readOnly ? (
                    <div className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200">
                      Viaje confirmado — solo lectura
                    </div>
                  ) : !detailPickerOpen ? (
                    <button
                      onClick={() => setDetailPickerOpen(true)}
                      className={`w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
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
                    <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-3">

                      {/* Horario de operación */}
                      {(selectedPlace.isOpenNow != null || selectedPlace.todayHours) && (
                        <div className="bg-white rounded-lg p-2 border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <IoTimeOutline className="text-gray-400 text-xs" />
                              <span className="text-[10px] font-semibold text-gray-500">Horario de operación</span>
                            </div>
                            {selectedPlace.isOpenNow != null && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                selectedPlace.isOpenNow ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                              }`}>
                                {selectedPlace.isOpenNow ? "Abierto ahora" : "Cerrado ahora"}
                              </span>
                            )}
                          </div>
                          {selectedPlace.todayHours && (
                            <p className="text-[10px] text-gray-500">{selectedPlace.todayHours}</p>
                          )}
                          {selectedPlace.weeklyHours && selectedPlace.weeklyHours.length > 0 && (
                            <>
                              <button
                                onClick={() => setShowHours((v) => !v)}
                                className="text-[9px] text-blue-500 hover:text-blue-700 mt-0.5"
                              >
                                {showHours ? "Ver menos" : "Ver semana completa"}
                              </button>
                              {showHours && (
                                <ul className="mt-1 space-y-0.5">
                                  {selectedPlace.weeklyHours.map((line: string, i: number) => (
                                    <li key={i} className="text-[9px] text-gray-500">{line}</li>
                                  ))}
                                </ul>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Selector de día */}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                          Selecciona el día
                        </p>
                        <div className="grid grid-cols-4 gap-1">
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
                      </div>

                      {/* Horario de visita — TimePicker */}
                      <div className="bg-white rounded-lg border border-gray-100 p-2.5 space-y-2">
                        <p className="text-[10px] font-semibold text-gray-500">
                          Horario de visita <span className="font-normal text-gray-400">(opcional)</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <TimePicker
                            label="Entrada"
                            value={addStartTime}
                            onChange={setAddStartTime}
                            placeholder="6:00 AM"
                          />
                          <TimePicker
                            label="Salida"
                            value={addEndTime}
                            onChange={setAddEndTime}
                            placeholder="8:00 PM"
                          />
                        </div>
                      </div>

                      <textarea
                        value={addNote}
                        onChange={(e) => setAddNote(e.target.value)}
                        placeholder="Nota opcional..."
                        rows={2}
                        className="w-full text-[10px] border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none bg-white"
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
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2 p-4">
                <IoCompass className="text-3xl" />
                <p className="text-xs text-center text-gray-400">
                  Selecciona un lugar para ver sus detalles
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── POI card ──────────────────────────────────────────────────────────────────
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
      className={`group relative w-full text-left bg-white rounded-xl overflow-hidden shadow-sm border transition-all duration-200 cursor-pointer ${
        selected
          ? "border-blue-500 shadow-md ring-1 ring-blue-200 -translate-y-0.5"
          : "border-gray-100 hover:border-gray-200 hover:shadow-md hover:-translate-y-1"
      }`}
    >
      {/* Add button */}
      <button
        onClick={(e) => { e.stopPropagation(); onPickerToggle(); }}
        title="Agregar al itinerario"
        className={`absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-150 ${
          added
            ? "bg-green-500 text-white"
            : "bg-white/90 text-blue-500 hover:bg-blue-500 hover:text-white"
        }`}
      >
        {added ? <IoCheckmark className="text-xs" /> : <IoAdd className="text-sm" />}
      </button>

      {/* Day picker popover */}
      {pickerOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-9 right-1.5 z-20 bg-white rounded-xl shadow-lg border border-gray-100 p-2 w-36"
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

      {/* Image with overlays */}
      <div className="relative w-full h-28 bg-gray-100 overflow-hidden">
        {poi.photoUrl ? (
          <img
            src={poi.photoUrl}
            alt={poi.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <IoCompass className="text-3xl text-gray-200" />
          </div>
        )}
        {poi.isOpenNow != null && (
          <span className={`absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow ${
            poi.isOpenNow ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}>
            {poi.isOpenNow ? "Abierto" : "Cerrado"}
          </span>
        )}
        {poi.rating && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-black/55 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <IoStar className="text-amber-400 text-[9px]" />
            <span className="text-white text-[10px] font-bold">{poi.rating.toFixed(1)}</span>
            {poi.ratingCount && (
              <span className="text-white/70 text-[8px]">
                ({poi.ratingCount > 999 ? `${(poi.ratingCount / 1000).toFixed(1)}k` : poi.ratingCount})
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-2.5">
        {poi.priceLevel && (
          <div className="flex items-center gap-0.5 text-gray-400 mb-1">
            <IoPricetag className="text-[9px]" />
            <span className="text-[10px]">{poi.priceLevel}</span>
          </div>
        )}
        <h3 className="font-semibold text-gray-800 text-xs leading-tight line-clamp-1">{poi.name}</h3>
        {poi.description && (
          <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{poi.description}</p>
        )}
        <div className="flex items-start gap-1 mt-1.5">
          <IoLocationSharp className="text-gray-400 text-[9px] flex-shrink-0 mt-0.5" />
          <p className="text-[9px] text-gray-400 line-clamp-1">{poi.address}</p>
        </div>
      </div>
    </div>
  );
}
