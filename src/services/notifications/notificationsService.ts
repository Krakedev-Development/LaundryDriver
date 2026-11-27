import { apiClient } from "../api/apiClient";
import { getStoredAuthSession } from "../auth/authService";

export interface ServerNotification {
  id: string;
  userId?: string | null;
  customerId?: string | null;
  orderId?: string | null;
  category: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}

export interface ServerNotificationListResponse {
  page: number;
  pageSize: number;
  total: number;
  unread: number;
  data: ServerNotification[];
}

export type DevicePlatform = "IOS" | "ANDROID" | "WEB";
export type DeviceAppType = "CLIENT" | "DRIVER" | "WEB";

async function resolveAccessToken(
  explicit?: string | null,
): Promise<string | null> {
  if (explicit) return explicit;
  const session = await getStoredAuthSession();
  return session.accessToken;
}

export async function listNotifications(opts?: {
  unread?: boolean;
  page?: number;
  pageSize?: number;
  accessToken?: string | null;
}): Promise<ServerNotificationListResponse> {
  const accessToken = await resolveAccessToken(opts?.accessToken);
  const params = new URLSearchParams();
  if (opts?.unread !== undefined) params.set("unread", String(opts.unread));
  if (opts?.page !== undefined) params.set("page", String(opts.page));
  if (opts?.pageSize !== undefined) {
    params.set("pageSize", String(opts.pageSize));
  }
  const qs = params.toString();
  return apiClient.get<ServerNotificationListResponse>(
    `/notifications${qs ? `?${qs}` : ""}`,
    { accessToken },
  );
}

export async function markNotificationRead(
  id: string,
  explicitToken?: string | null,
): Promise<{ id: string; read: boolean }> {
  const accessToken = await resolveAccessToken(explicitToken);
  return apiClient.post<{ id: string; read: boolean }>(
    `/notifications/${encodeURIComponent(id)}/read`,
    {},
    { accessToken },
  );
}

export async function markAllNotificationsRead(
  explicitToken?: string | null,
): Promise<{ updated: number }> {
  const accessToken = await resolveAccessToken(explicitToken);
  return apiClient.post<{ updated: number }>(
    "/notifications/read-all",
    {},
    { accessToken },
  );
}

export async function registerDeviceToken(
  payload: {
    token: string;
    platform: DevicePlatform;
    appType?: DeviceAppType;
    deviceName?: string;
  },
  explicitToken?: string | null,
): Promise<{ id: string; token: string; active: boolean }> {
  const accessToken = await resolveAccessToken(explicitToken);
  return apiClient.post<{ id: string; token: string; active: boolean }>(
    "/notifications/devices",
    {
      token: payload.token.trim(),
      platform: payload.platform,
      appType: payload.appType ?? "DRIVER",
      ...(payload.deviceName ? { deviceName: payload.deviceName } : {}),
    },
    { accessToken },
  );
}

export async function unregisterDeviceToken(
  token: string,
  explicitToken?: string | null,
): Promise<{ unregistered: boolean }> {
  const accessToken = await resolveAccessToken(explicitToken);
  return apiClient.delete<{ unregistered: boolean }>(
    `/notifications/devices?token=${encodeURIComponent(token.trim())}`,
    { accessToken },
  );
}

export const notificationsService = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  registerDeviceToken,
  unregisterDeviceToken,
};
