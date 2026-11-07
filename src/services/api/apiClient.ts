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

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
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
    throw new ApiError(
      "No se pudo conectar con el servidor.",
      0,
      error,
    );
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
    const payload = parsed as
      | { message?: string | string[]; error?: string }
      | null;
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
