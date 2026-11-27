import { apiClient } from "../api/apiClient";
import { getStoredAuthSession } from "../auth/authService";

export type ChatSenderRole = "CLIENT" | "DRIVER" | "SUPERVISOR" | "ADMIN";

export interface ServerChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: ChatSenderRole;
  text: string;
  createdAt: string;
}

export function chatRoleLabel(role: ChatSenderRole | string): string {
  switch (role) {
    case "CLIENT":
      return "Cliente";
    case "SUPERVISOR":
      return "Soporte sede";
    case "ADMIN":
      return "Administración";
    case "DRIVER":
      return "Chofer";
    default:
      return String(role);
  }
}

export function mergeChatMessages(
  existing: ServerChatMessage[],
  incoming: ServerChatMessage[],
): ServerChatMessage[] {
  const map = new Map<string, ServerChatMessage>();
  for (const m of existing) {
    if (m?.id) map.set(m.id, m);
  }
  for (const m of incoming) {
    if (m?.id) map.set(m.id, m);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

async function resolveAccessToken(
  explicit?: string | null,
): Promise<string | null> {
  if (explicit) return explicit;
  const session = await getStoredAuthSession();
  return session.accessToken;
}

export async function listOrderMessages(
  orderId: string,
  opts?: { after?: string; limit?: number; accessToken?: string | null },
): Promise<ServerChatMessage[]> {
  const accessToken = await resolveAccessToken(opts?.accessToken);
  const params = new URLSearchParams();
  if (opts?.after) params.set("after", opts.after);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  const rows = await apiClient.get<ServerChatMessage[]>(
    `/orders/${encodeURIComponent(orderId)}/messages${qs ? `?${qs}` : ""}`,
    { accessToken },
  );
  return Array.isArray(rows) ? rows : [];
}

export async function sendOrderMessage(
  orderId: string,
  text: string,
  explicitToken?: string | null,
): Promise<ServerChatMessage> {
  const accessToken = await resolveAccessToken(explicitToken);
  return apiClient.post<ServerChatMessage>(
    `/orders/${encodeURIComponent(orderId)}/messages`,
    { text: text.trim() },
    { accessToken },
  );
}

export const chatService = {
  listOrderMessages,
  sendOrderMessage,
  mergeChatMessages,
  chatRoleLabel,
};
