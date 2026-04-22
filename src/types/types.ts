// ─── Itinerary ────────────────────────────────────────────────────────────────

export type ItineraryItem = {
  itemId?: string;
  id: string;
  type: "poi" | "restaurant" | "hotel" | "flight";
  name: string;
  address: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
  rating?: number | null;
  priceLevel?: string | null;
  description?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  estimatedCost?: number | null;
  notes?: string | null;
  isOpenNow?: boolean | null;
  todayHours?: string | null;
  weeklyHours?: string[] | null;
};

export type TripDay = {
  dayId: string;
  dayNumber: number;
  date: string;
};

export type DayPlan = TripDay & {
  items: ItineraryItem[];
};

export type TripItinerary = {
  tripId: string;
  days: DayPlan[];
};

// ─── Trip ─────────────────────────────────────────────────────────────────────

export type TripStatus = "DRAFT" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type Trip = {
  trip_id: string;
  trip_name: string;
  start_date: string;
  end_date: string;
  status: TripStatus;
  is_favorite: boolean;
  destination_name?: string;
  destination_city?: string;
  destination_image?: string;
  total_days?: number;
  total_items?: number;
};

export type TripMeta = {
  startDate: string;
  endDate: string;
  photoUrl: string | null;
  lat: number | null;
  lng: number | null;
  country: string | null;
  totalBudget: number | null;
  currency: string;
};

// ─── Trip page navigation ──────────────────────────────────────────────────────

export type TripSection = "vuelos" | "hospedaje" | "puntos" | "restaurantes" | "itinerario";

// ─── Destination / Place ──────────────────────────────────────────────────────

export type Destination = {
  name: string;
  country: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
};

export type PlaceResult = {
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
};

// ─── Saved hotel / flight summaries (trip page sidebar) ───────────────────────

export type SavedHotel = {
  name: string;
  imageUrl: string | null;
  price: string;
  externalId?: string;
};

export type SavedFlight = {
  airline: string;
  origin: string | null;
  destination: string | null;
  departure: string | null;
  price: number | null;
};
