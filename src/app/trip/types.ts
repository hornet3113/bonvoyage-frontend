export type ItineraryItem = {
  itemId?: string;      // UUID from itinerary_items table (assigned after API save, used for DELETE)
  id: string;           // place ID (Google Places / POI ID, used to detect duplicates)
  type: "poi" | "restaurant";
  name: string;
  address: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
  rating?: number | null;
  priceLevel?: string | null;
};

export type TripDay = {
  dayId: string;        // UUID from itinerary_days table
  dayNumber: number;
  date: string;         // "2026-06-01"
};

export type DayPlan = TripDay & {
  items: ItineraryItem[];
};

export type TripItinerary = {
  tripId: string;
  days: DayPlan[];
};
