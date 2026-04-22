"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Header from "@/app/components/Header";
import TripNav from "./components/TripNav";
import FlightsSection from "./components/FlightsSection";
import HotelsSection from "./components/HotelsSection";
import PointsOfInterestSection from "./components/PointsOfInterestSection";
import RestaurantsSection from "./components/RestaurantsSection";
import ItinerarySection from "./components/ItinerarySection";
import { IoHeart, IoHeartOutline, IoCheckmarkCircle, IoCloseCircle, IoTrophy, IoEllipsisHorizontalCircle, IoTrashOutline, IoPencilOutline, IoClose, IoWallet } from "react-icons/io5";
import { useRouter } from "next/navigation";
import type { ItineraryItem, TripItinerary, DayPlan, TripSection, TripMeta, TripStatus } from "@/types/types";
import { useTripTimeTracker } from "@/hooks/useTripTimeTracker";
import { createApiClient, ApiError } from "@/lib/api";

function TripPageContent() {
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const router = useRouter();

  const rawTripId = searchParams?.get("tripId") ?? null;
  // Guard against literal "undefined" / "null" strings that sneak in when the
  // wizard navigates before the trip creation response resolves the ID.
  const tripId = rawTripId && rawTripId !== "undefined" && rawTripId !== "null" ? rawTripId : null;

  const [activeSection, setActiveSection] = useState<TripSection>(() => {
    if (!tripId) return "vuelos";
    try {
      const saved = sessionStorage.getItem(`bonvoyage_tab_${tripId}`);
      if (saved && ["vuelos","hospedaje","puntos","restaurantes","itinerario"].includes(saved))
        return saved as TripSection;
    } catch { /* ignore */ }
    return "vuelos";
  });

  function handleSectionChange(section: TripSection) {
    setActiveSection(section);
    if (tripId) {
      try { sessionStorage.setItem(`bonvoyage_tab_${tripId}`, section); } catch { /* ignore */ }
    }
  }

  const [itinerary, setItinerary] = useState<TripItinerary>({ tripId: tripId ?? "", days: [] });
  const [savedHotel, setSavedHotel] = useState<{ name: string; imageUrl: string | null; price: string; externalId?: string } | null>(null);
  const [savedFlight, setSavedFlight] = useState<{ airline: string; origin: string | null; destination: string | null; departure: string | null; price: number | null } | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(!!tripId);
  const [tripError, setTripError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const togglingFav = useRef(false);
  const [tripStatus, setTripStatus] = useState<TripStatus>("DRAFT");
  const [changingStatus, setChangingStatus] = useState(false);

  // Mide el tiempo activo de planificación (solo cuando status === DRAFT)
  useTripTimeTracker(tripId, tripStatus === "DRAFT");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editCurrency, setEditCurrency] = useState("USD");
  const [savingEdit, setSavingEdit] = useState(false);
  const [tripMeta, setTripMeta] = useState<TripMeta | null>(null);

  const urlLat = parseFloat(searchParams.get("lat") ?? "NaN");
  const urlLng = parseFloat(searchParams.get("lng") ?? "NaN");

  const destination = {
    name: searchParams.get("name") ?? "Destino",
    country: searchParams.get("country") ?? tripMeta?.country ?? "",
    lat: (!isNaN(urlLat) ? urlLat : null) ?? tripMeta?.lat ?? 0,
    lng: (!isNaN(urlLng) ? urlLng : null) ?? tripMeta?.lng ?? 0,
    photoUrl: searchParams.get("photoUrl") ?? tripMeta?.photoUrl ?? null,
  };

  // Pre-fill flight params passed from the wizard (or loaded from backend)
  const wizardFlightParams = {
    origin: searchParams.get("origin") ?? "",
    startDate: searchParams.get("startDate") ?? tripMeta?.startDate ?? "",
    endDate: searchParams.get("endDate") ?? tripMeta?.endDate ?? "",
    passengers: parseInt(searchParams.get("passengers") ?? "1"),
    cabinClass: searchParams.get("cabinClass") ?? "economy",
  };

  const loadTrip = useCallback(async () => {
    if (!tripId) return;
    setLoadingTrip(true);
    const api = createApiClient(getToken);
    try {
      // Retry once on 500/400 — race condition right after trip creation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let json: any;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        json = await api.get<any>(`/api/v1/trips/${tripId}`);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 500 || err.status === 400)) {
          await new Promise((r) => setTimeout(r, 1500));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          json = await api.get<any>(`/api/v1/trips/${tripId}`);
        } else {
          throw err;
        }
      }
      const data = json.data ?? json;

      // Map backend response to our DayPlan shape
      const days: DayPlan[] = (data.days ?? []).map((d: {
        day_id: string;
        day_number: number;
        day_date?: string;
        date?: string;
        items?: Array<{
          item_id: string;
          item_type?: string;
          place_reference_id?: string | null;
          flight_reference_id?: string | null;
          // enriched place fields (from place_references JOIN)
          place_name?: string | null;
          place_address?: string | null;
          place_latitude?: number | null;
          place_longitude?: number | null;
          place_photo_url?: string | null;
          place_category?: string | null;
          place_rating?: number | null;
          place_price_level?: string | null;
          place_external_id?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          estimated_cost?: number | null;
          notes?: string | null;
          extended_data?: string | null;
          // enriched flight fields (from flight_references JOIN)
          flight_airline_code?: string | null;
          flight_origin_airport?: string | null;
          flight_destination_airport?: string | null;
          flight_departure_time?: string | null;
          flight_price?: number | null;
        } | null>;
      }) => ({
        dayId: d.day_id,
        dayNumber: d.day_number,
        date: d.day_date?.slice(0, 10) ?? d.date?.slice(0, 10) ?? "",
        items: (d.items ?? [])
          .filter((item): item is NonNullable<typeof item> => !!item?.item_id && (item.item_type === "PLACE" || item.item_type === "FLIGHT"))
          .map((item) => {
            if (item.item_type === "FLIGHT") {
              const origin = item.flight_origin_airport ?? "";
              const dest   = item.flight_destination_airport ?? "";
              return {
                itemId: item.item_id,
                id: item.flight_reference_id ?? item.item_id,
                type: "flight" as const,
                name: item.flight_airline_code ?? "Vuelo",
                address: origin && dest ? `${origin} → ${dest}` : "",
                lat: 0,
                lng: 0,
                photoUrl: null,
                rating: null,
                priceLevel: null,
              };
            }
            const ext = (() => {
              try { return item.extended_data ? JSON.parse(item.extended_data) : {}; }
              catch { return {}; }
            })();
            return {
              itemId: item.item_id,
              id: item.place_external_id ?? item.place_reference_id ?? item.item_id,
              type: (
                item.place_category === "HOTEL" ? "hotel"
                : item.place_category === "RESTAURANT" ? "restaurant"
                : "poi"
              ) as "poi" | "restaurant" | "hotel",
              name: item.place_name ?? "",
              address: item.place_address ?? "",
              lat: item.place_latitude ?? 0,
              lng: item.place_longitude ?? 0,
              photoUrl: item.place_photo_url ?? null,
              rating: item.place_rating ?? null,
              priceLevel: item.place_price_level ?? null,
              startTime: item.start_time ?? null,
              endTime: item.end_time ?? null,
              estimatedCost: item.estimated_cost ?? null,
              notes: item.notes ?? null,
              isOpenNow: ext.is_open_now ?? null,
              todayHours: ext.today_hours ?? null,
              weeklyHours: ext.weekly_hours ?? null,
            };
          }),
      }));

      setItinerary({ tripId, days });

      // Restore "Mis ubicaciones" from persisted items
      let hotelFound = false;
      let flightFound = false;
      for (const d of (data.days ?? [])) {
        for (const item of (d.items ?? [])) {
          if (!item) continue;
          if (!hotelFound && item.item_type === "PLACE" && item.place_category === "HOTEL" && item.place_name) {
            hotelFound = true;
            setSavedHotel({
              name: item.place_name,
              imageUrl: item.place_photo_url ?? null,
              price: item.estimated_cost ? `$${item.estimated_cost}` : "",
              externalId: item.place_external_id ?? undefined,
            });
          }
          if (!flightFound && item.item_type === "FLIGHT" && item.flight_airline_code) {
            flightFound = true;
            setSavedFlight({
              airline: item.flight_airline_code,
              origin: item.flight_origin_airport ?? null,
              destination: item.flight_destination_airport ?? null,
              departure: item.flight_departure_time ?? null,
              price: item.flight_price ?? item.estimated_cost ?? null,
            });
          }
        }
      }

      setIsFavorite(data.is_favorite ?? false);
      setTripStatus(data.status ?? "DRAFT");

      // Store trip-level metadata to fill in missing URL params
      setTripMeta({
        startDate: data.start_date?.slice(0, 10) ?? "",
        endDate: data.end_date?.slice(0, 10) ?? "",
        photoUrl: data.destination_image ?? null,
        lat: data.destination_lat ?? data.latitude ?? null,
        lng: data.destination_lng ?? data.longitude ?? null,
        country: data.destination_country ?? data.country ?? null,
        totalBudget: data.total_budget ?? null,
        currency: data.currency ?? "USD",
      });
    } catch (err: unknown) {
      setTripError(err instanceof Error ? err.message : "Error al cargar el viaje");
    } finally {
      setLoadingTrip(false);
    }
  }, [tripId, getToken]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  async function toggleFavorite() {
    if (!tripId || togglingFav.current) return;
    togglingFav.current = true;
    const next = !isFavorite;
    setIsFavorite(next);
    const api = createApiClient(getToken);
    try {
      await api.patch(`/api/v1/trips/${tripId}`, { is_favorite: next });
    } catch {
      setIsFavorite(!next); // revert
    } finally {
      togglingFav.current = false;
    }
  }

  async function changeStatus(action: "confirm" | "cancel" | "complete") {
    if (!tripId || changingStatus) return;
    setChangingStatus(true);
    const api = createApiClient(getToken);
    try {
      const json = await api.post<Record<string, unknown>>(`/api/v1/trips/${tripId}/${action}`, {});
      const data = (json.data ?? json) as Record<string, unknown>;
      setTripStatus((data.status as typeof tripStatus) ?? (action === "confirm" ? "CONFIRMED" : action === "cancel" ? "CANCELLED" : "COMPLETED"));
    } catch {
      // silent — keep current status
    } finally {
      setChangingStatus(false);
    }
  }

  function openEdit() {
    setEditName(destination.name ?? "");
    setEditStart(tripMeta?.startDate ?? wizardFlightParams.startDate ?? "");
    setEditEnd(tripMeta?.endDate ?? wizardFlightParams.endDate ?? "");
    setEditBudget(tripMeta?.totalBudget != null ? String(tripMeta.totalBudget) : "");
    setEditCurrency(tripMeta?.currency ?? "USD");
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!tripId || savingEdit) return;
    setSavingEdit(true);
    const api = createApiClient(getToken);
    try {
      const body: Record<string, unknown> = {
        trip_name: editName,
        start_date: editStart,
        end_date: editEnd,
        currency: editCurrency,
      };
      if (editBudget) body.total_budget = parseFloat(editBudget);
      await api.patch(`/api/v1/trips/${tripId}`, body);
      setTripMeta((prev) => prev ? {
        ...prev,
        startDate: editStart,
        endDate: editEnd,
        currency: editCurrency,
        totalBudget: editBudget ? parseFloat(editBudget) : prev.totalBudget,
      } : prev);
      setEditOpen(false);
    } catch {
      // silent
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteTrip() {
    if (!tripId || deletingTrip) return;
    setDeletingTrip(true);
    const api = createApiClient(getToken);
    try {
      await api.delete(`/api/v1/trips/${tripId}`);
      router.push("/my-trips");
    } catch {
      setDeletingTrip(false);
      setConfirmingDelete(false);
    }
  }

  async function addToItinerary(item: ItineraryItem, dayNumber: number, options?: { start_time?: string; end_time?: string; notes?: string }) {
    if (!tripId || tripStatus !== "DRAFT") return;
    const day = itinerary.days.find((d) => d.dayNumber === dayNumber);
    if (day?.items.some((i) => i.id === item.id)) return; // already added

    // Optimistic update — create a placeholder day if the trip hasn't loaded yet
    const tempId = crypto.randomUUID();
    setItinerary((prev) => {
      const existing = prev.days.find((d) => d.dayNumber === dayNumber);
      if (existing) {
        return {
          ...prev,
          days: prev.days.map((d) =>
            d.dayNumber === dayNumber
              ? { ...d, items: [...d.items, { ...item, itemId: tempId, startTime: options?.start_time ?? null, endTime: options?.end_time ?? null, notes: options?.notes ?? null }] }
              : d
          ),
        };
      }
      // Trip not loaded yet — add a placeholder day so the UI still shows the item
      return {
        ...prev,
        days: [
          ...prev.days,
          { dayId: `placeholder-${dayNumber}`, dayNumber, date: "", items: [{ ...item, itemId: tempId, startTime: options?.start_time ?? null, endTime: options?.end_time ?? null, notes: options?.notes ?? null }] },
        ].sort((a, b) => a.dayNumber - b.dayNumber),
      };
    });

    try {
      const api = createApiClient(getToken);

      const categoryMap: Record<string, string> = {
        poi: "POI",
        restaurant: "RESTAURANT",
        hotel: "HOTEL",
      };

      // 1. Save/upsert place reference → get reference_id
      let reference_id: string;
      try {
        const saved = await api.post<{ reference_id: string }>("/api/v1/places/save", {
          external_id: item.id,
          category: categoryMap[item.type] ?? "POI",
          name: item.name,
          latitude: item.lat,
          longitude: item.lng,
          rating: item.rating ?? null,
          photo_url: item.photoUrl ?? null,
          address: item.address ?? null,
          price_level: item.priceLevel ?? null,
        });
        reference_id = saved.reference_id;
      } catch {
        return; // keep optimistic item shown
      }

      // 2. Add item to the itinerary day (skip if day has no real backend ID)
      if (!day?.dayId || day.dayId.startsWith("placeholder-")) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = await api.post<any>(`/api/v1/trips/${tripId}/days/${day.dayId}/items`, {
        item_type: "PLACE",
        place_reference_id: reference_id,
        ...(options?.start_time && { start_time: options.start_time }),
        ...(options?.end_time   && { end_time:   options.end_time }),
        ...(options?.notes      && { notes:       options.notes }),
      });
      // Reemplazar el tempId optimista con el item_id real del backend
      const realItemId = (created?.data ?? created)?.item_id;
      if (realItemId) {
        setItinerary((prev) => ({
          ...prev,
          days: prev.days.map((d) =>
            d.dayNumber === dayNumber
              ? {
                  ...d,
                  items: d.items.map((i) =>
                    i.itemId === tempId ? { ...i, itemId: realItemId } : i
                  ),
                }
              : d
          ),
        }));
      }
    } catch {
      // silent — optimistic item stays visible
    }
  }

  function reorderItinerary(dayNumber: number, items: ItineraryItem[]) {
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.dayNumber === dayNumber ? { ...d, items } : d
      ),
    }));
  }

  async function editItineraryItem(
    itemId: string,
    dayNumber: number,
    fields: { start_time?: string; end_time?: string; estimated_cost?: number; notes?: string }
  ) {
    if (!tripId) return;
    const day = itinerary.days.find((d) => d.dayNumber === dayNumber);
    if (!day || day.dayId.startsWith("placeholder-")) return;
    const api = createApiClient(getToken);
    await api.patch(`/api/v1/trips/${tripId}/days/${day.dayId}/items/${itemId}`, fields);
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.dayNumber === dayNumber
          ? {
              ...d,
              items: d.items.map((i) =>
                (i.itemId ?? i.id) === itemId
                  ? {
                      ...i,
                      startTime: fields.start_time ?? i.startTime,
                      endTime: fields.end_time ?? i.endTime,
                      estimatedCost: fields.estimated_cost ?? i.estimatedCost,
                      notes: fields.notes ?? i.notes,
                    }
                  : i
              ),
            }
          : d
      ),
    }));
  }

  async function moveItineraryItem(itemId: string, fromDayNumber: number, targetDayId: string) {
    if (!tripId) return;
    const fromDay = itinerary.days.find((d) => d.dayNumber === fromDayNumber);
    if (!fromDay || fromDay.dayId.startsWith("placeholder-")) return;
    const api = createApiClient(getToken);
    await api.post(`/api/v1/trips/${tripId}/days/${fromDay.dayId}/items/${itemId}/move`, { target_day_id: targetDayId });
    setItinerary((prev) => {
      const item = prev.days
        .find((d) => d.dayNumber === fromDayNumber)
        ?.items.find((i) => (i.itemId ?? i.id) === itemId);
      if (!item) return prev;
      return {
        ...prev,
        days: prev.days.map((d) => {
          if (d.dayNumber === fromDayNumber)
            return { ...d, items: d.items.filter((i) => (i.itemId ?? i.id) !== itemId) };
          if (d.dayId === targetDayId)
            return { ...d, items: [...d.items, item] };
          return d;
        }),
      };
    });
  }

  async function removeFromItinerary(itemId: string, dayNumber: number) {
    if (!tripId || tripStatus !== "DRAFT") return;
    const day = itinerary.days.find((d) => d.dayNumber === dayNumber);
    if (!day) return;

    const api = createApiClient(getToken);
    try {
      await api.delete(`/api/v1/trips/${tripId}/days/${day.dayId}/items/${itemId}`);
    } catch {
      // silent
    }

    // Optimistic remove — keep days even when they have 0 items
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.dayNumber === dayNumber
          ? { ...d, items: d.items.filter((i) => i.itemId !== itemId) }
          : d
      ),
    }));
  }

  // Build tripDays: always use the full wizard date range so the day picker never collapses
  // after an optimistic add. When backend days are loaded we prefer their real dayIds.
  const tripDays: { dayId: string; dayNumber: number; date: string }[] = (() => {
    const start = wizardFlightParams.startDate ? new Date(wizardFlightParams.startDate) : null;
    const end = wizardFlightParams.endDate ? new Date(wizardFlightParams.endDate) : null;
    if (start && end && start <= end) {
      const days: { dayId: string; dayNumber: number; date: string }[] = [];
      const cur = new Date(start);
      let n = 1;
      while (cur <= end && n <= 30) {
        const dateStr = cur.toISOString().split("T")[0];
        // Prefer a real (non-placeholder) backend dayId for this day number
        const backendDay = itinerary.days.find(
          (d) => d.dayNumber === n && !d.dayId.startsWith("placeholder-")
        );
        days.push({
          dayId: backendDay?.dayId ?? `placeholder-${n}`,
          dayNumber: n,
          date: backendDay?.date || dateStr,
        });
        cur.setDate(cur.getDate() + 1);
        n++;
      }
      return days;
    }
    // No wizard dates — fall back to whatever the backend returned
    return itinerary.days.map((d) => ({ dayId: d.dayId, dayNumber: d.dayNumber, date: d.date }));
  })();

  const sectionComponents: Record<TripSection, React.ReactNode> = {
    vuelos: (
      <FlightsSection
        destination={destination}
        tripId={tripId ?? undefined}
        tripDays={tripDays}
        defaultOrigin={wizardFlightParams.origin}
        defaultDepartDate={wizardFlightParams.startDate}
        defaultReturnDate={wizardFlightParams.endDate}
        defaultPassengers={wizardFlightParams.passengers}
        defaultCabinClass={wizardFlightParams.cabinClass}
        onFlightSave={(info) => { setSavedFlight(info); loadTrip(); }}
      />
    ),
    hospedaje: (
      <HotelsSection
        destination={destination}
        tripId={tripId ?? ""}
        tripDays={tripDays}
        savedHotelExternalId={savedHotel?.externalId ?? null}
        onHotelSave={(hotel) => { setSavedHotel(hotel); loadTrip(); }}
      />
    ),
    puntos: (
      <PointsOfInterestSection
        destination={destination}
        tripDays={tripDays}
        onAddToItinerary={addToItinerary}
        readOnly={tripStatus !== "DRAFT"}
      />
    ),
    restaurantes: (
      <RestaurantsSection
        destination={destination}
        tripDays={tripDays}
        onAddToItinerary={addToItinerary}
        readOnly={tripStatus !== "DRAFT"}
      />
    ),
    itinerario: (
      <ItinerarySection
        tripId={tripId ?? undefined}
        itinerary={itinerary}
        currency={tripMeta?.currency ?? "USD"}
        onRemove={removeFromItinerary}
        onReorder={reorderItinerary}
        onEdit={tripStatus === "DRAFT" ? editItineraryItem : undefined}
        onMove={tripStatus === "DRAFT" ? moveItineraryItem : undefined}
        savedHotel={savedHotel}
        savedFlight={savedFlight}
        readOnly={tripStatus !== "DRAFT"}
        center={
          destination.lat && destination.lng
            ? { lat: destination.lat, lng: destination.lng }
            : undefined
        }
      />
    ),
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header variant="light" />
      <TripNav active={activeSection} onChange={handleSectionChange} />

      {/* Status bar */}
      {tripId && (
        <div className="max-w-6xl mx-auto w-full px-4 pt-4">
          <div className="flex items-center gap-3 bg-white border border-cyan-100 rounded-2xl px-5 py-3 shadow-sm">
            {/* Status badge */}
            <div className="flex items-center gap-2 flex-1">
              {tripStatus === "DRAFT" && (
                <><IoEllipsisHorizontalCircle className="text-cyan-400 text-xl flex-shrink-0" /><span className="text-sm font-semibold text-cyan-600">Borrador</span></>
              )}
              {tripStatus === "CONFIRMED" && (
                <><IoCheckmarkCircle className="text-cyan-500 text-xl flex-shrink-0" /><span className="text-sm font-semibold text-cyan-700">Confirmado</span></>
              )}
              {tripStatus === "COMPLETED" && (
                <><IoTrophy className="text-cyan-600 text-xl flex-shrink-0" /><span className="text-sm font-semibold text-cyan-800">Completado</span></>
              )}
              {tripStatus === "CANCELLED" && (
                <><IoCloseCircle className="text-red-400 text-xl flex-shrink-0" /><span className="text-sm font-semibold text-red-500">Cancelado</span></>
              )}
            </div>

            {/* Edit — solo en DRAFT */}
            {tripStatus === "DRAFT" && !confirmingDelete && (
              <button
                onClick={openEdit}
                title="Editar viaje"
                className="p-2 rounded-full hover:bg-cyan-50 transition-colors flex-shrink-0"
              >
                <IoPencilOutline className="text-gray-300 hover:text-cyan-400 text-lg transition-colors" />
              </button>
            )}

            {/* Delete */}
            {confirmingDelete ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-gray-500">¿Eliminar?</span>
                <button
                  onClick={deleteTrip}
                  disabled={deletingTrip}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                title="Eliminar viaje"
                className="p-2 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <IoTrashOutline className="text-gray-300 hover:text-red-400 text-lg transition-colors" />
              </button>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {tripStatus === "DRAFT" && (
                <>
                  <button
                    onClick={() => changeStatus("confirm")}
                    disabled={changingStatus}
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <IoCheckmarkCircle className="text-sm" />
                    Confirmar
                  </button>
                  <button
                    onClick={() => changeStatus("cancel")}
                    disabled={changingStatus}
                    className="px-4 py-1.5 bg-white hover:bg-red-50 disabled:opacity-50 text-red-400 border border-red-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <IoCloseCircle className="text-sm" />
                    Cancelar
                  </button>
                </>
              )}
              {tripStatus === "CONFIRMED" && (
                <>
                  <button
                    onClick={() => changeStatus("complete")}
                    disabled={changingStatus}
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    
                    Marcar completado
                  </button>
                  <button
                    onClick={() => changeStatus("cancel")}
                    disabled={changingStatus}
                    className="px-4 py-1.5 bg-white hover:bg-red-50 disabled:opacity-50 text-red-400 border border-red-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <IoCloseCircle className="text-sm" />
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Destination hero */}
      <div className="max-w-6xl mx-auto w-full px-4 pt-6">
        <div className="relative h-100 w-full overflow-hidden rounded-2xl bg-gray-800 shadow-md">
          {destination.photoUrl ? (
            <img
              src={destination.photoUrl}
              alt={destination.name}
              className="w-full h-full object-cover opacity-75"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-400" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Favorito — esquina superior derecha */}
          {tripId && (
            <button
              onClick={toggleFavorite}
              title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
              className="absolute top-5 right-5 w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              {isFavorite
                ? <IoHeart className="text-red-400 text-2xl" />
                : <IoHeartOutline className="text-white text-2xl" />
              }
            </button>
          )}

          {/* Nombre y país — estilo slider, zona inferior */}
          <div className="absolute bottom-24 left-7">
            <div className="mb-2 h-[2px] w-6 rounded-full bg-white" />
            {destination.country && (
              <p className="mb-1 text-[11px] uppercase tracking-widest text-white/60">
                {destination.country}
              </p>
            )}
            <h1 className="text-5xl font-black uppercase leading-tight text-white drop-shadow-lg">
              {destination.name}
            </h1>
            {loadingTrip && (
              <p className="text-white/60 text-sm mt-2">Cargando itinerario...</p>
            )}
            {tripError && (
              <p className="text-red-300 text-sm mt-2">{tripError}</p>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 w-full pt-0 pb-24 md:pb-6">
        {sectionComponents[activeSection]}
      </main>

      {/* Modal editar viaje */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">Editar viaje</h2>
              <button onClick={() => setEditOpen(false)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                <IoClose className="text-gray-400 text-lg" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nombre del viaje</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Ida</label>
                  <input
                    type="date"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Vuelta</label>
                  <input
                    type="date"
                    value={editEnd}
                    min={editStart}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Presupuesto</label>
                  <div className="relative mt-1">
                    <IoWallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="number"
                      min={0}
                      value={editBudget}
                      onChange={(e) => setEditBudget(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Moneda</label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="MXN">MXN</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit || !editName.trim() || !editStart || !editEnd}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {savingEdit ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TripPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Cargando...</div>}>
      <TripPageContent />
    </Suspense>
  );
}
