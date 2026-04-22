import { createApiClient } from "@/lib/api";
import type { GetTokenFn } from "./trips";

export interface SavePlacePayload {
  external_id: string;
  category: string;
  name: string;
  latitude: number;
  longitude: number;
  rating?: number | null;
  photo_url?: string | null;
  address?: string | null;
  price_level?: string | null;
}

export async function savePlaceReference(
  getToken: GetTokenFn,
  payload: SavePlacePayload
): Promise<{ reference_id: string }> {
  return createApiClient(getToken).post<{ reference_id: string }>("/api/v1/places/save", payload);
}
