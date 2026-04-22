import { createApiClient, ApiError } from "@/lib/api";
import type { TripStatus } from "@/types/types";

export type GetTokenFn = () => Promise<string | null>;

export async function fetchTripById(getToken: GetTokenFn, tripId: string) {
  const api = createApiClient(getToken);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await api.get<any>(`/api/v1/trips/${tripId}`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 500 || err.status === 400)) {
      await new Promise((r) => setTimeout(r, 1500));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return api.get<any>(`/api/v1/trips/${tripId}`);
    }
    throw err;
  }
}

export async function patchTrip(getToken: GetTokenFn, tripId: string, body: Record<string, unknown>) {
  return createApiClient(getToken).patch(`/api/v1/trips/${tripId}`, body);
}

export async function deleteTripById(getToken: GetTokenFn, tripId: string) {
  return createApiClient(getToken).delete(`/api/v1/trips/${tripId}`);
}

export async function tripAction(
  getToken: GetTokenFn,
  tripId: string,
  action: "confirm" | "cancel" | "complete"
): Promise<{ data?: { status?: TripStatus }; status?: TripStatus }> {
  return createApiClient(getToken).post(`/api/v1/trips/${tripId}/${action}`, {});
}
