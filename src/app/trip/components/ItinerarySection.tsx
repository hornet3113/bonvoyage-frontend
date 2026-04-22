"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@clerk/nextjs";
import {
  IoCalendar, IoCompass, IoRestaurant, IoBed, IoAirplane,
  IoArrowForward, IoLocationSharp, IoStar, IoTrash, IoMap, IoReorderThree, IoClose,
  IoPencil, IoSwapHorizontal, IoTimeOutline, IoWallet, IoChevronDown,
} from "react-icons/io5";
import type { TripItinerary, ItineraryItem } from "../types";
import {
  DndContext, closestCenter, DragEndEvent,
  PointerSensor, useSensor, useSensors, useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, horizontalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ItineraryMap = dynamic(() => import("./ItineraryMap"), { ssr: false });

import { createApiClient } from "@/lib/api";

type LiveHours = { isOpenNow: boolean | null; todayHours: string | null; weeklyHours: string[] | null };

type Budget = {
  ticket_id?: string;
  trip_id: string;
  total_budget: number;
  accumulated_cost: number;
  available_balance: number;
  total_places: number;
  total_flights: number;
  total_items: number;
  budget_status: string;
  updated_at?: string;
};

type SavedHotel = { name: string; imageUrl: string | null; price: string };
type SavedFlight = { airline: string; origin: string | null; destination: string | null; departure: string | null; price: number | null };
type EditFields = { start_time?: string; end_time?: string; estimated_cost?: number; notes?: string };

type Props = {
  tripId?: string;
  itinerary: TripItinerary;
  currency?: string;
  onRemove: (itemId: string, dayNumber: number) => void;
  onReorder?: (dayNumber: number, items: ItineraryItem[]) => void;
  onEdit?: (itemId: string, dayNumber: number, fields: EditFields) => Promise<void>;
  onMove?: (itemId: string, fromDayNumber: number, targetDayId: string) => Promise<void>;
  savedHotel?: SavedHotel | null;
  savedFlight?: SavedFlight | null;
  center?: { lat: number; lng: number };
  readOnly?: boolean;
};

function formatTime(t: string | null | undefined): string {
  if (!t) return "";
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(t)) return t.slice(0, 5);
  try {
    const d = new Date(t);
    if (isNaN(d.getTime())) return t;
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch { return t; }
}

function fmt(n: number) {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── Budget ticket (collapsible) ────────────────────────────────────────────────
function BudgetTicket({ budget, currency }: { budget: Budget; currency: string }) {
  const [expanded, setExpanded] = useState(false);

  const STATUS: Record<string, { badge: string; label: string; bar: string }> = {
    WITHIN_BUDGET: { badge: "bg-green-100 text-green-700",  label: "En rango",   bar: "bg-green-400" },
    WARNING:       { badge: "bg-amber-100 text-amber-700",  label: "Advertencia",bar: "bg-amber-400" },
    OVER_BUDGET:   { badge: "bg-red-100 text-red-600",      label: "Excedido",   bar: "bg-red-400"   },
    WITHOUT_DATA:  { badge: "bg-gray-100 text-gray-500",    label: "Sin datos",  bar: "bg-gray-300"  },
  };
  const s = STATUS[budget.budget_status] ?? STATUS.WITHOUT_DATA;
  const pct = budget.total_budget > 0
    ? Math.min((budget.accumulated_cost / budget.total_budget) * 100, 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-dashed border-blue-200 shadow-sm overflow-hidden">
      {/* ── Header — always visible, click to toggle ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
          <IoWallet className="text-blue-500 text-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Gastos acumulados</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${s.badge}`}>
              {s.label}
            </span>
          </div>
          <p className="text-xl font-black text-gray-800 leading-tight">
            {fmt(budget.accumulated_cost)}{" "}
            <span className="text-xs font-normal text-gray-400">{currency}</span>
          </p>
        </div>
        <IoChevronDown
          className={`text-gray-300 text-base flex-shrink-0 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ── Progress bar ── */}
      {budget.total_budget > 0 && (
        <div className="px-4 pb-3 -mt-1">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${s.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[9px] text-gray-400 mt-0.5 text-right">
            {pct.toFixed(0)}% de {fmt(budget.total_budget)}
          </p>
        </div>
      )}

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="border-t border-dashed border-blue-100 px-4 py-3 space-y-3">
          {/* Presupuesto / Disponible */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Presupuesto</p>
              <p className="text-sm font-bold text-gray-700 mt-0.5">{fmt(budget.total_budget)}</p>
            </div>
            <div className={`rounded-xl p-2.5 ${(budget.available_balance ?? 0) < 0 ? "bg-red-50" : "bg-green-50"}`}>
              <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Disponible</p>
              <p className={`text-sm font-bold mt-0.5 ${(budget.available_balance ?? 0) < 0 ? "text-red-500" : "text-green-600"}`}>
                {fmt(budget.available_balance ?? 0)}
              </p>
            </div>
          </div>

          {/* Desglose */}
          <div className="space-y-1.5 border-t border-gray-100 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <IoAirplane className="text-blue-400 text-sm" />
                <span>Vuelos</span>
              </div>
              <span className="text-xs font-semibold text-gray-700">{budget.total_flights}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <IoCompass className="text-blue-400 text-sm" />
                <span>Lugares</span>
              </div>
              <span className="text-xs font-semibold text-gray-700">{budget.total_places}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <IoCalendar className="text-blue-400 text-sm" />
                <span>Total items</span>
              </div>
              <span className="text-xs font-semibold text-gray-700">{budget.total_items}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ItinerarySection({
  tripId, itinerary, currency = "USD", onRemove, onReorder, onEdit, onMove,
  savedHotel, savedFlight, center, readOnly = false,
}: Props) {
  const { getToken } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showWeeklyHours, setShowWeeklyHours] = useState(false);
  const [liveHours, setLiveHours] = useState<LiveHours | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);

  // ── Budget ──
  const [budget, setBudget] = useState<Budget | null>(null);

  async function refreshBudget() {
    if (!tripId) return;
    const api = createApiClient(getToken);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await api.get<any>(`/api/v1/trips/${tripId}/ticket`);
    const data = json?.data ?? json;
    if (data?.ticket_id) setBudget(data);
  }

  useEffect(() => {
    refreshBudget().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // Edit modal
  const [editingItem, setEditingItem] = useState<{ item: ItineraryItem; dayNumber: number } | null>(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Move modal
  const [movingItem, setMovingItem] = useState<{ item: ItineraryItem; fromDayNumber: number } | null>(null);
  const [moveSaving, setMoveSaving] = useState(false);

  useEffect(() => {
    if (!selectedId) { setLiveHours(null); return; }
    const item = itinerary.days.flatMap(d => d.items).find(i => i.id === selectedId);
    if (!item || item.type === "hotel" || item.type === "flight") { setLiveHours(null); return; }
    if (item.isOpenNow != null || item.todayHours) {
      setLiveHours({ isOpenNow: item.isOpenNow ?? null, todayHours: item.todayHours ?? null, weeklyHours: item.weeklyHours ?? null });
      return;
    }
    let cancelled = false;
    async function fetchHours() {
      const api = createApiClient(getToken);
      const endpoint = item!.type === "restaurant" ? "restaurants" : "poi";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await api.get<any>(`/api/v1/${endpoint}?lat=${item!.lat}&lng=${item!.lng}`);
      if (cancelled) return;
      const found = (data.places ?? []).find((p: { id: string }) => p.id === item!.id);
      if (!cancelled) setLiveHours(found ? { isOpenNow: found.isOpenNow ?? null, todayHours: found.todayHours ?? null, weeklyHours: found.weeklyHours ?? null } : null);
    }
    fetchHours().catch(() => { if (!cancelled) setLiveHours(null); });
    return () => { cancelled = true; };
  }, [selectedId]);

  function selectItem(id: string | null) {
    setSelectedId(id);
    setShowWeeklyHours(false);
  }

  function openEdit(item: ItineraryItem, dayNumber: number) {
    setEditingItem({ item, dayNumber });
    setEditStartTime(item.startTime ? item.startTime.slice(0, 5) : "");
    setEditEndTime(item.endTime ? item.endTime.slice(0, 5) : "");
    setEditCost(item.estimatedCost != null ? String(item.estimatedCost) : "");
    setEditNotes(item.notes ?? "");
  }

  async function handleSaveEdit() {
    if (!editingItem || !onEdit) return;
    setEditSaving(true);
    setEditError(null);
    const fields: EditFields = {};
    if (editStartTime) fields.start_time = editStartTime.slice(0, 5);
    if (editEndTime) fields.end_time = editEndTime.slice(0, 5);
    if (editCost !== "") fields.estimated_cost = parseFloat(editCost);
    if (editNotes !== "") fields.notes = editNotes;
    try {
      await onEdit(editingItem.item.itemId ?? editingItem.item.id, editingItem.dayNumber, fields);
      setEditingItem(null);
      refreshBudget().catch(() => {});
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleMove(targetDayId: string) {
    if (!movingItem || !onMove) return;
    setMoveSaving(true);
    try {
      await onMove(movingItem.item.itemId ?? movingItem.item.id, movingItem.fromDayNumber, targetDayId);
      setMovingItem(null);
    } finally {
      setMoveSaving(false);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleGlobalDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeDay = itinerary.days.find((d) => d.items.some((i) => (i.itemId ?? i.id) === active.id));
    if (!activeDay) return;
    const overDay = itinerary.days.find((d) => d.dayId === over.id);
    if (overDay) {
      if (overDay.dayNumber !== activeDay.dayNumber && !overDay.dayId.startsWith("placeholder-") && onMove) {
        const activeItem = activeDay.items.find((i) => (i.itemId ?? i.id) === active.id)!;
        onMove(activeItem.itemId ?? activeItem.id, activeDay.dayNumber, overDay.dayId);
      }
      return;
    }
    const overItemDay = itinerary.days.find((d) => d.items.some((i) => (i.itemId ?? i.id) === over.id));
    if (!overItemDay) return;
    if (activeDay.dayNumber === overItemDay.dayNumber) {
      const ids = activeDay.items.map((i) => i.itemId ?? i.id);
      const oldIdx = ids.indexOf(active.id as string);
      const newIdx = ids.indexOf(over.id as string);
      if (oldIdx !== newIdx) onReorder?.(activeDay.dayNumber, arrayMove(activeDay.items, oldIdx, newIdx));
    } else if (!overItemDay.dayId.startsWith("placeholder-") && onMove) {
      const activeItem = activeDay.items.find((i) => (i.itemId ?? i.id) === active.id)!;
      onMove(activeItem.itemId ?? activeItem.id, activeDay.dayNumber, overItemDay.dayId);
    }
  }

  const totalItems = itinerary.days.reduce((sum, d) => sum + d.items.length, 0);
  const hasLocations = savedHotel || savedFlight;
  const realDays = itinerary.days.filter((d) => !d.dayId.startsWith("placeholder-"));

  const mapItems = useMemo(() => {
    const seen = new Set<string>();
    return itinerary.days
      .flatMap((d) => d.items.map((item) => ({ item, dayNumber: d.dayNumber })))
      .filter(({ item }) => {
        if (item.type === "flight") return false;
        if (!item.lat || !item.lng) return false;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .map(({ item, dayNumber }) => ({
        id: item.id,
        name: item.name,
        lat: item.lat,
        lng: item.lng,
        type: item.type as "poi" | "restaurant" | "hotel",
        photoUrl: item.photoUrl,
        rating: item.rating,
        address: item.address,
        description: item.description,
        dayNumber,
      }));
  }, [itinerary.days]);

  const selectedFullItem = useMemo(() => {
    if (!selectedId) return null;
    for (const day of itinerary.days) {
      const item = day.items.find((i) => i.id === selectedId);
      if (item) return { item, dayNumber: day.dayNumber };
    }
    return null;
  }, [itinerary.days, selectedId]);

  const showMap = !!center && mapItems.length > 0;
  const BADGE: Record<string, { label: string; cls: string }> = {
    poi:        { label: "Lugar",       cls: "bg-blue-50 text-blue-600"     },
    restaurant: { label: "Restaurante", cls: "bg-orange-50 text-orange-500" },
    hotel:      { label: "Hotel",       cls: "bg-purple-50 text-purple-600" },
  };

  if (itinerary.days.length === 0 && !hasLocations) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 text-gray-400">
        <IoCalendar className="text-5xl text-gray-200" />
        <p className="text-sm text-center max-w-xs">
          Tu itinerario está vacío. Agrega puntos de interés o restaurantes desde las otras secciones usando el botón{" "}
          <span className="font-semibold text-blue-400">+</span>.
        </p>
      </div>
    );
  }

  // ── Right panel (shared between desktop sidebar + mobile panel) ──────────────
  const RightPanel = (
    <div className="flex flex-col gap-3">

      {/* Budget ticket */}
      {budget && <BudgetTicket budget={budget} currency={currency} />}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-gray-500 px-1 flex-wrap">
        <span className="flex items-center gap-1"><IoLocationSharp className="text-blue-500" /> Lugar</span>
        <span className="flex items-center gap-1"><IoLocationSharp className="text-orange-500" /> Restaurante</span>
        <span className="flex items-center gap-1"><IoLocationSharp className="text-indigo-500" /> Hotel</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-gray-400">
          <IoMap className="text-xs" />
          <span>{mapItems.length} lugar{mapItems.length !== 1 ? "es" : ""}</span>
        </div>
      </div>

      {/* Map */}
      <div className="h-56 lg:h-64 rounded-2xl overflow-hidden shadow-md border border-gray-100">
        <ItineraryMap
          items={mapItems}
          selectedId={selectedId}
          onSelectId={selectItem}
          center={center!}
        />
      </div>

      {/* Detail panel */}
      {selectedFullItem ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex gap-3 p-3">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
              {selectedFullItem.item.photoUrl ? (
                <img src={selectedFullItem.item.photoUrl} alt={selectedFullItem.item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {selectedFullItem.item.type === "hotel"
                    ? <IoBed className="text-2xl text-gray-200" />
                    : selectedFullItem.item.type === "restaurant"
                    ? <IoRestaurant className="text-2xl text-gray-200" />
                    : <IoCompass className="text-2xl text-gray-200" />}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <div>
                  <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${BADGE[selectedFullItem.item.type]?.cls}`}>
                    {BADGE[selectedFullItem.item.type]?.label}
                  </span>
                  <span className="ml-1.5 text-[9px] text-gray-400">· Día {selectedFullItem.dayNumber}</span>
                </div>
                <button onClick={() => selectItem(null)} className="p-0.5 rounded-full hover:bg-gray-100 flex-shrink-0">
                  <IoClose className="text-gray-400 text-sm" />
                </button>
              </div>
              <h3 className="font-bold text-gray-800 text-sm leading-snug mt-1 line-clamp-2">
                {selectedFullItem.item.name}
              </h3>
              {selectedFullItem.item.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <IoStar className="text-amber-400 text-xs" />
                  <span className="text-xs font-semibold text-gray-700">{selectedFullItem.item.rating.toFixed(1)}</span>
                </div>
              )}
              {selectedFullItem.item.address && (
                <div className="flex items-start gap-1 mt-1">
                  <IoLocationSharp className="text-gray-300 text-xs flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 line-clamp-2">{selectedFullItem.item.address}</p>
                </div>
              )}
            </div>
          </div>

          {liveHours && (liveHours.isOpenNow != null || liveHours.todayHours) && (
            <div className="px-3 pb-2 border-t border-gray-50 pt-2">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <IoTimeOutline className="text-gray-400 text-[10px]" />
                  <span className="text-[10px] font-semibold text-gray-500">Horario de operación</span>
                </div>
                {liveHours.isOpenNow != null && (
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    liveHours.isOpenNow ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                  }`}>
                    {liveHours.isOpenNow ? "Abierto" : "Cerrado"}
                  </span>
                )}
              </div>
              {liveHours.todayHours && <p className="text-[10px] text-gray-500">{liveHours.todayHours}</p>}
              {liveHours.weeklyHours && liveHours.weeklyHours.length > 0 && (
                <>
                  <button onClick={() => setShowWeeklyHours((v) => !v)} className="text-[9px] text-blue-500 hover:text-blue-700 mt-0.5">
                    {showWeeklyHours ? "Ver menos" : "Ver semana completa"}
                  </button>
                  {showWeeklyHours && (
                    <ul className="mt-1 space-y-0.5">
                      {liveHours.weeklyHours.map((line, i) => (
                        <li key={i} className="text-[9px] text-gray-500">{line}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          {(selectedFullItem.item.startTime || selectedFullItem.item.endTime) && (
            <div className="px-3 pb-2 border-t border-gray-50 pt-2">
              <div className="flex items-center gap-1 mb-0.5">
                <IoTimeOutline className="text-blue-400 text-[10px]" />
                <span className="text-[10px] font-semibold text-gray-500">Mi horario</span>
              </div>
              <p className="text-[10px] text-gray-600">
                {formatTime(selectedFullItem.item.startTime)}
                {selectedFullItem.item.startTime && selectedFullItem.item.endTime && " – "}
                {formatTime(selectedFullItem.item.endTime)}
              </p>
            </div>
          )}

          {selectedFullItem.item.notes && (
            <div className="px-3 pb-2 border-t border-gray-50 pt-2">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Nota</p>
              <p className="text-[10px] text-gray-600 leading-relaxed">{selectedFullItem.item.notes}</p>
            </div>
          )}

          {selectedFullItem.item.description && (
            <div className="px-3 pb-2 border-t border-gray-50 pt-2">
              <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-3">{selectedFullItem.item.description}</p>
            </div>
          )}

          {!readOnly && (onEdit || (onMove && realDays.length > 1)) && (
            <div className="flex gap-2 px-3 pb-3 border-t border-gray-50 pt-2">
              {onEdit && (
                <button
                  onClick={() => openEdit(selectedFullItem.item, selectedFullItem.dayNumber)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-gray-500 text-xs font-semibold transition-colors"
                >
                  <IoPencil className="text-xs" /> Editar
                </button>
              )}
              {onMove && realDays.length > 1 && (
                <button
                  onClick={() => setMovingItem({ item: selectedFullItem.item, fromDayNumber: selectedFullItem.dayNumber })}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 text-gray-500 text-xs font-semibold transition-colors"
                >
                  <IoSwapHorizontal className="text-xs" /> Mover
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 text-center">
          <IoCompass className="text-2xl text-gray-200 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Toca un marcador o una actividad para ver detalles</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-0 max-w-6xl mx-auto w-full">

      {/* ── Left: scrollable itinerary ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 px-4 pt-6 pb-10 space-y-8">

        {/* Mis ubicaciones */}
        {hasLocations && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0">
                <IoLocationSharp className="text-sm" />
              </div>
              <h2 className="text-base font-semibold text-gray-700">Mis ubicaciones</h2>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pl-11">
              {savedFlight && (
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="w-full h-24 bg-blue-50 flex items-center justify-center">
                    <IoAirplane className="text-3xl text-blue-300" />
                  </div>
                  <div className="p-2.5">
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">Vuelo</span>
                    <h3 className="font-semibold text-gray-800 text-xs leading-tight line-clamp-1 mt-1">{savedFlight.airline}</h3>
                    {savedFlight.origin && savedFlight.destination && (
                      <p className="text-[9px] text-gray-500 mt-0.5">{savedFlight.origin} → {savedFlight.destination}</p>
                    )}
                    {savedFlight.price != null && (
                      <p className="text-[9px] font-semibold text-blue-600 mt-0.5">${savedFlight.price}</p>
                    )}
                  </div>
                </div>
              )}
              {savedHotel && (
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="w-full h-24 bg-gray-100 overflow-hidden">
                    {savedHotel.imageUrl ? (
                      <img src={savedHotel.imageUrl} alt={savedHotel.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <IoBed className="text-3xl text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">Hotel</span>
                    <h3 className="font-semibold text-gray-800 text-xs leading-tight line-clamp-2 mt-1">{savedHotel.name}</h3>
                    {savedHotel.price && savedHotel.price !== "Precio no disponible" && (
                      <p className="text-[9px] font-semibold text-blue-600 mt-0.5">{savedHotel.price}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <IoCalendar className="text-blue-400" />
            <span>
              {itinerary.days.length} día{itinerary.days.length !== 1 ? "s" : ""} &middot;{" "}
              {totalItems} actividad{totalItems !== 1 ? "es" : ""}
            </span>
          </div>
          {/* Mobile: show budget ticket inline if no map panel, or toggle map */}
          {showMap && (
            <button
              onClick={() => setShowMobileMap((v) => !v)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-gray-200 shadow-sm text-xs font-semibold text-gray-600 hover:border-blue-300"
            >
              <IoMap className="text-blue-400 text-sm" />
              {showMobileMap ? "Ocultar mapa" : "Ver mapa"}
            </button>
          )}
        </div>

        {/* Mobile map panel (toggled) */}
        {showMap && showMobileMap && (
          <div className="lg:hidden rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            {RightPanel}
          </div>
        )}

        {/* All days */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGlobalDragEnd}>
          <div className="space-y-8">
            {itinerary.days.map((day) => (
              <div key={day.dayNumber}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {day.dayNumber}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-700">Día {day.dayNumber}</h2>
                    {day.date && (
                      <p className="text-xs text-gray-400">
                        {new Date(day.date + "T00:00:00").toLocaleDateString("es-MX", {
                          weekday: "short", day: "numeric", month: "short",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">
                    {day.items.length} actividad{day.items.length !== 1 ? "es" : ""}
                  </span>
                </div>

                <DroppableDay id={day.dayId} readOnly={readOnly}>
                  <SortableContext
                    items={day.items.map((i) => i.itemId ?? i.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div
                      className="flex gap-3 overflow-x-auto pb-2 pl-11 pr-4 min-h-[220px]"
                      style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}
                    >
                      {day.items.map((item) => (
                        <SortableItineraryCard
                          key={item.itemId ?? item.id}
                          item={item}
                          selected={selectedId === item.id}
                          onSelect={() => selectItem(item.type !== "flight" ? item.id : null)}
                          onRemove={() => onRemove(item.itemId ?? item.id, day.dayNumber)}
                          onEdit={!readOnly && onEdit ? () => openEdit(item, day.dayNumber) : undefined}
                          onMove={!readOnly && onMove && realDays.length > 1
                            ? () => setMovingItem({ item, fromDayNumber: day.dayNumber })
                            : undefined}
                          readOnly={readOnly}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableDay>
              </div>
            ))}
          </div>
        </DndContext>
      </div>

      {/* ── Edit modal ── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm">Editar actividad</h3>
              <button onClick={() => setEditingItem(null)} className="p-1 rounded-full hover:bg-gray-100">
                <IoClose className="text-gray-400 text-lg" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-gray-500 truncate font-medium">{editingItem.item.name}</p>
              {editingItem.item.type !== "hotel" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Hora inicio</label>
                    <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full mt-1 px-2 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Hora fin</label>
                    <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full mt-1 px-2 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                </div>
              )}
              {editingItem.item.type !== "hotel" && (
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Costo estimado ({currency})</label>
                  <input type="number" min={0} value={editCost} onChange={(e) => setEditCost(e.target.value)}
                    placeholder="0"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              )}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Notas</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                  rows={2} placeholder="Reservación, tips..."
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>
            {editError && (
              <p className="px-5 pb-2 text-xs text-red-500">{editError}</p>
            )}
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setEditingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-semibold">
                Cancelar
              </button>
              <button onClick={handleSaveEdit} disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold">
                {editSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Move modal ── */}
      {movingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm">Mover a otro día</h3>
              <button onClick={() => setMovingItem(null)} className="p-1 rounded-full hover:bg-gray-100">
                <IoClose className="text-gray-400 text-lg" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-gray-500 truncate font-medium">{movingItem.item.name}</p>
              <p className="text-[10px] text-gray-400">
                Actualmente en <span className="font-semibold text-gray-600">Día {movingItem.fromDayNumber}</span>
              </p>
              <div className="space-y-1.5">
                {realDays.filter((d) => d.dayNumber !== movingItem.fromDayNumber).map((d) => (
                  <button key={d.dayId} onClick={() => handleMove(d.dayId)} disabled={moveSaving}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-sm text-gray-700 disabled:opacity-50 transition-colors">
                    <span className="font-semibold">Día {d.dayNumber}</span>
                    {d.date && (
                      <span className="text-xs text-gray-400">
                        {new Date(d.date + "T00:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setMovingItem(null)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-semibold">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Right: desktop map + detail panel ─────────────────────────────── */}
      {showMap && (
        <div className="hidden lg:block w-[380px] flex-shrink-0 pr-4 pt-6 pb-10">
          <div className="sticky top-4">
            {RightPanel}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Droppable day ─────────────────────────────────────────────────────────────
function DroppableDay({ id, readOnly, children }: { id: string; readOnly?: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: readOnly || id.startsWith("placeholder-"),
  });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl transition-all duration-150 ${isOver ? "bg-blue-50 ring-2 ring-blue-200 ring-inset" : ""}`}
    >
      {children}
    </div>
  );
}

// ── Sortable wrapper ──────────────────────────────────────────────────────────
function SortableItineraryCard(props: {
  item: ItineraryItem;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onEdit?: () => void;
  onMove?: () => void;
  readOnly?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item.itemId ?? props.item.id,
    disabled: props.readOnly,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      className="w-52 flex-shrink-0"
    >
      <ItineraryCard {...props} dragHandleProps={!props.readOnly ? { ...attributes, ...listeners } : undefined} />
    </div>
  );
}

// ── Itinerary card ────────────────────────────────────────────────────────────
function ItineraryCard({
  item,
  selected,
  onSelect,
  onRemove,
  readOnly = false,
  dragHandleProps,
}: {
  item: ItineraryItem;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onEdit?: () => void;
  onMove?: () => void;
  readOnly?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}) {
  if (item.type === "flight") {
    return (
      <div className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group h-[200px] flex flex-col">
        {!readOnly && (
          <>
            <button onClick={onRemove} title="Eliminar"
              className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50">
              <IoTrash className="text-red-400 text-xs" />
            </button>
            <div {...dragHandleProps}
              className="absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
              <IoReorderThree className="text-gray-400 text-sm" />
            </div>
          </>
        )}
        <div className="w-full h-28 bg-blue-50 flex items-center justify-center flex-shrink-0">
          <IoAirplane className="text-3xl text-blue-300" />
        </div>
        <div className="p-2.5 flex-1 flex flex-col justify-between overflow-hidden">
          <div>
            <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">Vuelo</span>
            <h3 className="font-semibold text-gray-800 text-xs leading-tight line-clamp-1 mt-1">{item.name}</h3>
            {item.address && (
              <div className="flex items-center gap-1 mt-0.5">
                <IoArrowForward className="text-gray-300 text-[9px] flex-shrink-0" />
                <p className="text-[9px] text-gray-400 line-clamp-1">{item.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const Icon = item.type === "hotel" ? IoBed : item.type === "restaurant" ? IoRestaurant : IoCompass;

  return (
    <div
      onClick={onSelect}
      className={`relative bg-white rounded-xl overflow-hidden shadow-sm border transition-all duration-150 cursor-pointer group h-[200px] flex flex-col ${
        selected ? "border-blue-400 shadow-md ring-1 ring-blue-200" : "border-gray-100 hover:border-gray-300"
      }`}
    >
      {!readOnly && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            title="Eliminar"
            className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
          >
            <IoTrash className="text-red-400 text-xs" />
          </button>
          <div
            {...dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <IoReorderThree className="text-gray-400 text-sm" />
          </div>
        </>
      )}

      {/* Image */}
      <div className="w-full h-28 bg-gray-100 overflow-hidden flex-shrink-0">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <Icon className="text-2xl text-gray-200" />
          </div>
        )}
      </div>

      {/* Content — fills remaining space, overflow hidden */}
      <div className="p-2.5 flex-1 flex flex-col justify-between overflow-hidden">
        <div>
          <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
            item.type === "poi" ? "bg-blue-50 text-blue-600"
            : item.type === "hotel" ? "bg-purple-50 text-purple-600"
            : "bg-orange-50 text-orange-500"
          }`}>
            {item.type === "poi" ? "Lugar" : item.type === "hotel" ? "Hotel" : "Restaurante"}
          </span>
          <h3 className="font-semibold text-gray-800 text-xs leading-tight line-clamp-2 mt-1">{item.name}</h3>
        </div>

        <div className="space-y-0.5 mt-1">
          {item.rating && (
            <div className="flex items-center gap-1">
              <IoStar className="text-amber-400 text-[10px]" />
              <span className="text-[10px] text-gray-600">{item.rating.toFixed(1)}</span>
              {item.priceLevel && <span className="text-[10px] text-gray-400 ml-1">{item.priceLevel}</span>}
            </div>
          )}
          {(item.startTime || item.endTime) && (
            <div className="flex items-center gap-1">
              <IoTimeOutline className="text-blue-400 text-[9px]" />
              <span className="text-[9px] text-gray-500">
                {formatTime(item.startTime)}{item.startTime && item.endTime ? "–" : ""}{formatTime(item.endTime)}
              </span>
            </div>
          )}
          <div className="flex items-start gap-1">
            <IoLocationSharp className="text-gray-400 text-[9px] flex-shrink-0 mt-0.5" />
            <p className="text-[9px] text-gray-400 line-clamp-1">{item.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
