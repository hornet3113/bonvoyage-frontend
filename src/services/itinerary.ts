import { createApiClient } from "@/lib/api";
import type { GetTokenFn } from "./trips";

export async function addDayItem(
  getToken: GetTokenFn,
  tripId: string,
  dayId: string,
  body: Record<string, unknown>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createApiClient(getToken).post<any>(`/api/v1/trips/${tripId}/days/${dayId}/items`, body);
}

export async function removeDayItem(
  getToken: GetTokenFn,
  tripId: string,
  dayId: string,
  itemId: string
) {
  return createApiClient(getToken).delete(`/api/v1/trips/${tripId}/days/${dayId}/items/${itemId}`);
}

export async function patchDayItem(
  getToken: GetTokenFn,
  tripId: string,
  dayId: string,
  itemId: string,
  fields: Record<string, unknown>
) {
  return createApiClient(getToken).patch(
    `/api/v1/trips/${tripId}/days/${dayId}/items/${itemId}`,
    fields
  );
}

export async function moveDayItem(
  getToken: GetTokenFn,
  tripId: string,
  dayId: string,
  itemId: string,
  targetDayId: string
) {
  return createApiClient(getToken).post(
    `/api/v1/trips/${tripId}/days/${dayId}/items/${itemId}/move`,
    { target_day_id: targetDayId }
  );
}
