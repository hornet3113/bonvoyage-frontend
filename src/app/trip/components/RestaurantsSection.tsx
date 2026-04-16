"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@clerk/nextjs";
import {
  IoStar, IoLocationSharp, IoRestaurant, IoPricetag,
  IoSearch, IoAdd, IoCheckmark, IoCalendarOutline, IoTimeOutline,
} from "react-icons/io5";
import type { ItineraryItem, TripDay } from "../types";

const POIMap = dynamic(() => import("./POIMap"), { ssr: false });

type Place = {
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

const CATEGORIES = [
  "Todos", "Italiano", "Asiático", "Mexicano", "Mariscos", "Café",
  "Parrilla", "Vegetariano", "Pizza", "Sushi", "Comida rápida", "Fusión",
];

export default function RestaurantsSection({ destination, tripDays, onAddToItinerary, readOnly = false }: Props) {
  const { getToken } = useAuth();
  const days: TripDay[] = tripDays ?? [];
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [detailPickerOpen, setDetailPickerOpen] = useState(false);
  const [addStartTime, setAddStartTime] = useState("");
  const [addEndTime, setAddEndTime] = useState("");
  const [addNote, setAddNote] = useState("");
  const [showHours, setShowHours] = useState(false);

  useEffect(() => {
    async function fetchRestaurants() {
      setLoading(true);
      const api = createApiClient(getToken);
      try {
        const data = await api.get<{ places?: Place[] }>(`/api/v1/restaurants?lat=${destination.lat}&lng=${destination.lng}`);
        setPlaces(data.places ?? []);
        if (data.places && data.places.length > 0) setSelectedId(data.places[0].id);
      } catch {
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRestaurants();
  }, [destination.lat, destination.lng]);

  const filtered = useMemo(() => {
    let list = places;
    if (activeCategory !== "Todos") {
      const cat = activeCategory.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(cat) ||
          p.description?.toLowerCase().includes(cat)
      );
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
    return list;
  }, [places, query, activeCategory]);

  const selectedPlace = filtered.find((p) => p.id === selectedId) ?? places.find((p) => p.id === selectedId) ?? null;

  function buildItem(place: Place): ItineraryItem {
    return {
      id: place.id,
      type: "restaurant",
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      photoUrl: place.photoUrl,
      rating: place.rating,
      priceLevel: place.priceLevel,
      description: place.description,
      isOpenNow: place.isOpenNow,
      todayHours: place.todayHours,
      weeklyHours: place.weeklyHours,
    };
  }

  function handleAddToDay(place: Place, day: number) {
    onAddToItinerary(buildItem(place), day);
    setAddedIds((prev) => new Set(prev).add(place.id));
    setPickerOpenId(null);
    setDetailPickerOpen(false);
  }

  function handleDetailAddToDay(place: Place, day: number) {
    onAddToItinerary(buildItem(place), day, {
      start_time: addStartTime || undefined,
      end_time: addEndTime || undefined,
      notes: addNote || undefined,
    });
    setAddedIds((prev) => new Set(prev).add(place.id));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 gap-3 text-gray-400">
        <IoRestaurant className="text-3xl animate-pulse" />
        <span className="text-sm">Buscando restaurantes...</span>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 text-gray-400">
        <IoRestaurant className="text-5xl text-gray-200" />
        <p className="text-sm">No se encontraron restaurantes cerca de {destination.name}.</p>
      </div>
    );
  }

  return (
    <div className="px-6 max-w-6xl mx-auto pt-6 pb-8 space-y-4">

      {/* Search + filters bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar restaurante…"
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition"
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? "lugar" : "lugares"}
          </span>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                activeCategory === cat
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5 items-start">

        {/* Cards grid — scrollable */}
        <div className="flex-1 min-w-0 overflow-y-auto max-h-[calc(100vh-260px)] pr-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
              <IoRestaurant className="text-4xl text-gray-200" />
              <p className="text-sm text-center">
                {activeCategory !== "Todos"
                  ? `Sin resultados para "${activeCategory}"${query ? ` · "${query}"` : ""}`
                  : `Sin resultados para "${query}"`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((place) => (
                <RestaurantCard
                  key={place.id}
                  place={place}
                  days={days}
                  selected={selectedId === place.id}
                  added={addedIds.has(place.id)}
                  pickerOpen={pickerOpenId === place.id}
                  onClick={() => selectPlace(place.id)}
                  onPickerToggle={() => setPickerOpenId(pickerOpenId === place.id ? null : place.id)}
                  onAddToDay={(day) => handleAddToDay(place, day)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right column: large map + detail panel */}
        <div className="w-[420px] flex-shrink-0 sticky top-[72px] h-[calc(100vh-200px)] flex flex-col gap-3">

          {/* Map — fills available height */}
          <div className="flex-1 min-h-0 rounded-2xl overflow-hidden shadow-md border border-gray-100">
            <POIMap
              places={filtered}
              selectedId={selectedId}
              onSelectId={(id) => selectPlace(id)}
              center={{ lat: destination.lat, lng: destination.lng }}
            />
          </div>

          {/* Detail panel */}
          {selectedPlace && (
            <div className="flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-h-72 overflow-y-auto">
              <div className="flex gap-3">
                {selectedPlace.photoUrl && (
                  <div className="w-24 flex-shrink-0 overflow-hidden rounded-l-2xl">
                    <img
                      src={selectedPlace.photoUrl}
                      alt={selectedPlace.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">{selectedPlace.name}</h3>
                    {selectedPlace.isOpenNow != null && (
                      <span className={`flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                        selectedPlace.isOpenNow ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                      }`}>
                        {selectedPlace.isOpenNow ? "Abierto" : "Cerrado"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedPlace.rating && (
                      <div className="flex items-center gap-1">
                        <IoStar className="text-amber-400 text-xs" />
                        <span className="text-xs font-semibold text-gray-700">{selectedPlace.rating.toFixed(1)}</span>
                        {selectedPlace.ratingCount && (
                          <span className="text-[10px] text-gray-400">
                            ({selectedPlace.ratingCount > 999
                              ? `${(selectedPlace.ratingCount / 1000).toFixed(1)}k`
                              : selectedPlace.ratingCount})
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

                  {selectedPlace.todayHours && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <IoTimeOutline className="flex-shrink-0" />
                      <span>{selectedPlace.todayHours}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-1">
                    <IoLocationSharp className="text-gray-400 text-[10px] flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-gray-500 line-clamp-1">{selectedPlace.address}</p>
                  </div>

                  {readOnly ? (
                    <div className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200">
                      Viaje confirmado — solo lectura
                    </div>
                  ) : !detailPickerOpen ? (
                    <button
                      onClick={() => setDetailPickerOpen(true)}
                      className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        addedIds.has(selectedPlace.id)
                          ? "bg-green-50 text-green-600 border border-green-200"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {addedIds.has(selectedPlace.id) ? (
                        <><IoCheckmark className="text-sm" /> Añadido</>
                      ) : (
                        <><IoCalendarOutline className="text-sm" /> Añadir a mi día</>
                      )}
                    </button>
                  ) : (
                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Selecciona el día</p>
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

                      {selectedPlace.weeklyHours && selectedPlace.weeklyHours.length > 0 && (
                        <div>
                          <button
                            onClick={() => setShowHours((v) => !v)}
                            className="text-[9px] text-blue-500 hover:text-blue-700"
                          >
                            {showHours ? "Ocultar horarios" : "Ver horarios semanales"}
                          </button>
                          {showHours && (
                            <ul className="mt-1 space-y-0.5">
                              {selectedPlace.weeklyHours.map((line: string, i: number) => (
                                <li key={i} className="text-[9px] text-gray-500">{line}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      <div className="flex gap-1.5">
                        <div className="flex-1">
                          <label className="text-[9px] text-gray-400 uppercase tracking-wide block mb-0.5">Hora inicio</label>
                          <input
                            type="time"
                            value={addStartTime}
                            onChange={(e) => setAddStartTime(e.target.value)}
                            className="w-full text-[10px] border border-gray-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] text-gray-400 uppercase tracking-wide block mb-0.5">Hora fin</label>
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
                        placeholder="Nota opcional..."
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RestaurantCard({
  place,
  days,
  selected,
  added,
  pickerOpen,
  onClick,
  onPickerToggle,
  onAddToDay,
}: {
  place: Place;
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
      className={`relative w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm border transition-all duration-200 cursor-pointer group ${
        selected
          ? "border-blue-500 shadow-lg ring-2 ring-blue-100"
          : "border-gray-100 hover:border-gray-200 hover:shadow-md"
      }`}
    >
      {/* Image */}
      <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
        {place.photoUrl ? (
          <img
            src={place.photoUrl}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <IoRestaurant className="text-4xl text-gray-200" />
          </div>
        )}

        {/* Rating badge */}
        {place.rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
            <IoStar className="text-amber-400 text-[10px]" />
            <span className="text-[11px] font-bold text-gray-800">{place.rating.toFixed(1)}</span>
            {place.ratingCount && (
              <span className="text-[9px] text-gray-500">
                ({place.ratingCount > 999 ? `${(place.ratingCount / 1000).toFixed(1)}k` : place.ratingCount})
              </span>
            )}
          </div>
        )}

        {/* Open/closed badge */}
        {place.isOpenNow != null && (
          <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold shadow-sm ${
            place.isOpenNow
              ? "bg-green-500/90 text-white"
              : "bg-gray-800/70 text-white"
          }`}>
            {place.isOpenNow ? "Abierto" : "Cerrado"}
          </div>
        )}

        {/* Price badge */}
        {place.priceLevel && (
          <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
            <IoPricetag className="text-[9px] text-gray-500" />
            <span className="text-[10px] font-semibold text-gray-700">{place.priceLevel}</span>
          </div>
        )}

        {/* Add button */}
        <button
          onClick={(e) => { e.stopPropagation(); onPickerToggle(); }}
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
            className="absolute top-10 right-1.5 z-20 bg-white rounded-xl shadow-lg border border-gray-100 p-2 w-36"
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

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">
          {place.name}
        </h3>
        <div className="flex items-center gap-1.5">
          <IoLocationSharp className="text-blue-500 text-xs flex-shrink-0" />
          <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed">{place.address}</p>
        </div>
        <div className="flex items-center justify-between pt-0.5">
          {place.isOpenNow != null ? (
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
              place.isOpenNow ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
            }`}>
              {place.isOpenNow ? "Abierto" : "Cerrado"}
            </span>
          ) : <span />}
          {place.priceLevel && (
            <div className="flex items-center gap-0.5 text-gray-400">
              <IoPricetag className="text-[9px]" />
              <span className="text-[10px] font-medium">{place.priceLevel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
