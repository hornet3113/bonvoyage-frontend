"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { ItineraryItem, TripItinerary, DayPlan, TripSection, TripMeta, TripStatus, SavedHotel, SavedFlight } from "@/types/types";
import { useTripTimeTracker } from "@/hooks/useTripTimeTracker";
import { tripEditSchema } from "@/validators/trip";
import { fetchTripById, patchTrip, deleteTripById, tripAction } from "@/services/trips";
import { addDayItem, removeDayItem, patchDayItem, moveDayItem } from "@/services/itinerary";
import { savePlaceReference } from "@/services/places";

export function useTripPage() {
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const router = useRouter();

  const rawTripId = searchParams?.get("tripId") ?? null;
  const tripId =
    rawTripId && rawTripId !== "undefined" && rawTripId !== "null" ? rawTripId : null;

  const [activeSection, setActiveSection] = useState<TripSection>(() => {
    if (!tripId) return "vuelos";
    try {
      const saved = sessionStorage.getItem(`bonvoyage_tab_${tripId}`);
      if (saved && ["vuelos", "hospedaje", "puntos", "restaurantes", "itinerario"].includes(saved))
        return saved as TripSection;
    } catch { /* ignore */ }
    return "vuelos";
  });

  const [itinerary, setItinerary] = useState<TripItinerary>({ tripId: tripId ?? "", days: [] });
  const [savedHotel, setSavedHotel] = useState<SavedHotel | null>(null);
  const [savedFlight, setSavedFlight] = useState<SavedFlight | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(!!tripId);
  const [tripError, setTripError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const togglingFav = useRef(false);
  const [tripStatus, setTripStatus] = useState<TripStatus>("DRAFT");
  const [changingStatus, setChangingStatus] = useState(false);
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

  useTripTimeTracker(tripId, tripStatus === "DRAFT");

  const urlLat = parseFloat(searchParams.get("lat") ?? "NaN");
  const urlLng = parseFloat(searchParams.get("lng") ?? "NaN");

  const destination = {
    name: searchParams.get("name") ?? "Destino",
    country: searchParams.get("country") ?? tripMeta?.country ?? "",
    lat: (!isNaN(urlLat) ? urlLat : null) ?? tripMeta?.lat ?? 0,
    lng: (!isNaN(urlLng) ? urlLng : null) ?? tripMeta?.lng ?? 0,
    photoUrl: searchParams.get("photoUrl") ?? tripMeta?.photoUrl ?? null,
  };

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
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = await fetchTripById(getToken, tripId) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = json.data ?? json;

      const days: DayPlan[] = (data.days ?? []).map((d: {
        day_id: string; day_number: number; day_date?: string; date?: string;
        items?: Array<{
          item_id: string; item_type?: string;
          place_reference_id?: string | null; flight_reference_id?: string | null;
          place_name?: string | null; place_address?: string | null;
          place_latitude?: number | null; place_longitude?: number | null;
          place_photo_url?: string | null; place_category?: string | null;
          place_rating?: number | null; place_price_level?: string | null;
          place_external_id?: string | null;
          start_time?: string | null; end_time?: string | null;
          estimated_cost?: number | null; notes?: string | null; extended_data?: string | null;
          flight_airline_code?: string | null; flight_origin_airport?: string | null;
          flight_destination_airport?: string | null; flight_departure_time?: string | null;
          flight_price?: number | null;
        } | null>;
      }) => ({
        dayId: d.day_id,
        dayNumber: d.day_number,
        date: d.day_date?.slice(0, 10) ?? d.date?.slice(0, 10) ?? "",
        items: (d.items ?? [])
          .filter(
            (item): item is NonNullable<typeof item> =>
              !!item?.item_id && (item.item_type === "PLACE" || item.item_type === "FLIGHT")
          )
          .map((item) => {
            if (item.item_type === "FLIGHT") {
              const origin = item.flight_origin_airport ?? "";
              const dest = item.flight_destination_airport ?? "";
              return {
                itemId: item.item_id,
                id: item.flight_reference_id ?? item.item_id,
                type: "flight" as const,
                name: item.flight_airline_code ?? "Vuelo",
                address: origin && dest ? `${origin} → ${dest}` : "",
                lat: 0, lng: 0, photoUrl: null, rating: null, priceLevel: null,
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

      let hotelFound = false;
      let flightFound = false;
      for (const d of data.days ?? []) {
        for (const item of d.items ?? []) {
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

  function handleSectionChange(section: TripSection) {
    setActiveSection(section);
    if (tripId) {
      try { sessionStorage.setItem(`bonvoyage_tab_${tripId}`, section); } catch { /* ignore */ }
    }
  }

  async function toggleFavorite() {
    if (!tripId || togglingFav.current) return;
    togglingFav.current = true;
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      await patchTrip(getToken, tripId, { is_favorite: next });
    } catch {
      setIsFavorite(!next);
    } finally {
      togglingFav.current = false;
    }
  }

  async function changeStatus(action: "confirm" | "cancel" | "complete") {
    if (!tripId || changingStatus) return;
    setChangingStatus(true);
    try {
      const json = await tripAction(getToken, tripId, action);
      const data = json.data ?? json;
      setTripStatus(
        data.status ??
          (action === "confirm" ? "CONFIRMED" : action === "cancel" ? "CANCELLED" : "COMPLETED")
      );
    } catch { /* silent */ } finally {
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
    const parsed = tripEditSchema.safeParse({
      trip_name: editName,
      start_date: editStart,
      end_date: editEnd,
      currency: editCurrency,
      total_budget: editBudget ? parseFloat(editBudget) : null,
    });
    if (!parsed.success) return;
    setSavingEdit(true);
    try {
      const body: Record<string, unknown> = {
        trip_name: parsed.data.trip_name,
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date,
        currency: parsed.data.currency,
      };
      if (parsed.data.total_budget != null) body.total_budget = parsed.data.total_budget;
      await patchTrip(getToken, tripId, body);
      setTripMeta((prev) =>
        prev
          ? {
              ...prev,
              startDate: parsed.data.start_date,
              endDate: parsed.data.end_date,
              currency: parsed.data.currency ?? prev.currency,
              totalBudget: parsed.data.total_budget ?? prev.totalBudget,
            }
          : prev
      );
      setEditOpen(false);
    } catch { /* silent */ } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteTrip() {
    if (!tripId || deletingTrip) return;
    setDeletingTrip(true);
    try {
      await deleteTripById(getToken, tripId);
      router.push("/my-trips");
    } catch {
      setDeletingTrip(false);
      setConfirmingDelete(false);
    }
  }

  async function addToItinerary(
    item: ItineraryItem,
    dayNumber: number,
    options?: { start_time?: string; end_time?: string; notes?: string }
  ) {
    if (!tripId || tripStatus !== "DRAFT") return;
    const day = itinerary.days.find((d) => d.dayNumber === dayNumber);
    if (day?.items.some((i) => i.id === item.id)) return;

    const tempId = crypto.randomUUID();
    setItinerary((prev) => {
      const existing = prev.days.find((d) => d.dayNumber === dayNumber);
      if (existing) {
        return {
          ...prev,
          days: prev.days.map((d) =>
            d.dayNumber === dayNumber
              ? {
                  ...d,
                  items: [
                    ...d.items,
                    {
                      ...item, itemId: tempId,
                      startTime: options?.start_time ?? null,
                      endTime: options?.end_time ?? null,
                      notes: options?.notes ?? null,
                    },
                  ],
                }
              : d
          ),
        };
      }
      return {
        ...prev,
        days: [
          ...prev.days,
          {
            dayId: `placeholder-${dayNumber}`, dayNumber, date: "",
            items: [{ ...item, itemId: tempId, startTime: options?.start_time ?? null, endTime: options?.end_time ?? null, notes: options?.notes ?? null }],
          },
        ].sort((a, b) => a.dayNumber - b.dayNumber),
      };
    });

    try {
      const categoryMap: Record<string, string> = { poi: "POI", restaurant: "RESTAURANT", hotel: "HOTEL" };
      let reference_id: string;
      try {
        const saved = await savePlaceReference(getToken, {
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
        return;
      }

      if (!day?.dayId || day.dayId.startsWith("placeholder-")) return;
      const created = await addDayItem(getToken, tripId, day.dayId, {
        item_type: "PLACE",
        place_reference_id: reference_id,
        ...(options?.start_time && { start_time: options.start_time }),
        ...(options?.end_time && { end_time: options.end_time }),
        ...(options?.notes && { notes: options.notes }),
      });
      const realItemId = (created?.data ?? created)?.item_id;
      if (realItemId) {
        setItinerary((prev) => ({
          ...prev,
          days: prev.days.map((d) =>
            d.dayNumber === dayNumber
              ? { ...d, items: d.items.map((i) => (i.itemId === tempId ? { ...i, itemId: realItemId } : i)) }
              : d
          ),
        }));
      }
    } catch { /* silent */ }
  }

  function reorderItinerary(dayNumber: number, items: ItineraryItem[]) {
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) => (d.dayNumber === dayNumber ? { ...d, items } : d)),
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
    await patchDayItem(getToken, tripId, day.dayId, itemId, fields);
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
    await moveDayItem(getToken, tripId, fromDay.dayId, itemId, targetDayId);
    setItinerary((prev) => {
      const item = prev.days
        .find((d) => d.dayNumber === fromDayNumber)
        ?.items.find((i) => (i.itemId ?? i.id) === itemId);
      if (!item) return prev;
      return {
        ...prev,
        days: prev.days.map((d) => {
          if (d.dayNumber === fromDayNumber) return { ...d, items: d.items.filter((i) => (i.itemId ?? i.id) !== itemId) };
          if (d.dayId === targetDayId) return { ...d, items: [...d.items, item] };
          return d;
        }),
      };
    });
  }

  async function removeFromItinerary(itemId: string, dayNumber: number) {
    if (!tripId || tripStatus !== "DRAFT") return;
    const day = itinerary.days.find((d) => d.dayNumber === dayNumber);
    if (!day) return;
    try {
      await removeDayItem(getToken, tripId, day.dayId, itemId);
    } catch { /* silent */ }
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.dayNumber === dayNumber ? { ...d, items: d.items.filter((i) => i.itemId !== itemId) } : d
      ),
    }));
  }

  const tripDays: { dayId: string; dayNumber: number; date: string }[] = (() => {
    const start = wizardFlightParams.startDate ? new Date(wizardFlightParams.startDate) : null;
    const end = wizardFlightParams.endDate ? new Date(wizardFlightParams.endDate) : null;
    if (start && end && start <= end) {
      const days: { dayId: string; dayNumber: number; date: string }[] = [];
      const cur = new Date(start);
      let n = 1;
      while (cur <= end && n <= 30) {
        const dateStr = cur.toISOString().split("T")[0];
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
    return itinerary.days.map((d) => ({ dayId: d.dayId, dayNumber: d.dayNumber, date: d.date }));
  })();

  return {
    tripId,
    activeSection,
    handleSectionChange,
    itinerary,
    savedHotel,
    setSavedHotel,
    savedFlight,
    setSavedFlight,
    loadingTrip,
    tripError,
    isFavorite,
    tripStatus,
    changingStatus,
    confirmingDelete,
    setConfirmingDelete,
    deletingTrip,
    editOpen,
    setEditOpen,
    editName,
    setEditName,
    editStart,
    setEditStart,
    editEnd,
    setEditEnd,
    editBudget,
    setEditBudget,
    editCurrency,
    setEditCurrency,
    savingEdit,
    tripMeta,
    destination,
    wizardFlightParams,
    tripDays,
    loadTrip,
    toggleFavorite,
    changeStatus,
    openEdit,
    saveEdit,
    handleDeleteTrip,
    addToItinerary,
    reorderItinerary,
    editItineraryItem,
    moveItineraryItem,
    removeFromItinerary,
  };
}
