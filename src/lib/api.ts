export const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Crea un cliente HTTP centralizado autenticado con Clerk.
 * Uso: const api = createApiClient(getToken) dentro de un componente o hook.
 */
export function createApiClient(getToken: () => Promise<string | null>) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const res = await fetch(`${BACKEND}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => undefined);
      const message = (body as { error?: string } | undefined)?.error ?? `Error ${res.status}`;
      throw new ApiError(res.status, message, body);
    }
    return res.json() as Promise<T>;
  }

  return {
    get: <T>(path: string, init?: RequestInit) =>
      request<T>(path, { ...init, method: "GET" }),
    post: <T>(path: string, body: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: "POST", body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: "PATCH", body: JSON.stringify(body) }),
    delete: <T>(path: string, init?: RequestInit) =>
      request<T>(path, { ...init, method: "DELETE" }),
  };
}
