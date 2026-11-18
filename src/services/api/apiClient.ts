export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  accessToken?: string | null;
}

// ---------------------------------------------------------------- Sesión
// La sesión de acceso dura poco (15 min). Cuando el servidor la rechaza, se renueva una vez con
// el token de renovación y se repite el pedido. El servicio de sesión registra cómo renovar
// (así este módulo no depende de él). El renovador devuelve el nuevo token, null si el servidor
// rechazó la renovación, o lanza un error si no hubo conexión.
export const SESSION_EXPIRED_MESSAGE =
  "Tu sesión expiró. Inicia sesión nuevamente.";
type Refresher = () => Promise<string | null>;
let refresher: Refresher | null = null;
let refreshing: Promise<string | null> | null = null;
const expiredListeners = new Set<() => void>();

export function setSessionRefresher(fn: Refresher | null) {
  refresher = fn;
}

/** Se llama cuando la sesión ya no se puede renovar; devuelve la función para dejar de escuchar. */
export function onSessionExpired(listener: () => void) {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

// Varios pedidos que fallan a la vez comparten una sola renovación.
function renewSession(): Promise<string | null> {
  if (!refresher) return Promise.resolve(null);
  refreshing ??= refresher().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

const isAuthEndpoint = (endpoint: string) => /^\/auth\//.test(endpoint);

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  try {
    return await sendRequest<T>(endpoint, options);
  } catch (error) {
    const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    if (
      !(error instanceof ApiError) ||
      error.statusCode !== 401 ||
      !options.accessToken ||
      isAuthEndpoint(normalized)
    )
      throw error;
    // Si no hay conexión durante la renovación, se propaga ese error sin cerrar la sesión.
    const renewed = await renewSession();
    if (!renewed) {
      expiredListeners.forEach((listener) => listener());
      throw new ApiError(SESSION_EXPIRED_MESSAGE, 401, error.details);
    }
    return await sendRequest<T>(endpoint, { ...options, accessToken: renewed });
  }
}

async function sendRequest<T>(
  endpoint: string,
  options: ApiRequestOptions,
): Promise<T> {
  const { body, accessToken, headers, ...rest } = options;
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const url = `${API_BASE_URL.replace(/\/+$/, "")}${normalizedEndpoint}`;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ApiError("No se pudo conectar con el servidor.", 0, error);
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const payload = parsed as {
      message?: string | string[];
      error?: string;
    } | null;
    const rawMessage = payload?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage[0]
      : typeof rawMessage === "string"
        ? rawMessage
        : `Error de comunicación con el servidor (${response.status}).`;
    throw new ApiError(message, response.status, parsed);
  }

  return parsed as T;
}

export const apiClient = {
  baseUrl: API_BASE_URL,
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "POST", body }),
  put: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "PUT", body }),
  patch: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "PATCH", body }),
  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
