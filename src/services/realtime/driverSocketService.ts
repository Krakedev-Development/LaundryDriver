import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "../api/apiClient";
import {
  authService,
  getStoredAuthSession,
} from "../auth/authService";

export const SOCKET_BASE_URL = (() => {
  const configured = process.env.EXPO_PUBLIC_SOCKET_URL?.trim().replace(
    /\/+$/,
    "",
  );
  if (configured) return configured;
  return API_BASE_URL.replace(/\/api\/v1\/?$/, "");
})();

export interface DriverSocketLocationPayload {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  orderId?: string;
}

type SocketListener = (data: unknown) => void;

class DriverSocketService {
  private socket: Socket | null = null;
  private isAuthenticated = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private suppressReconnect = false;
  private readonly listeners = new Map<string, Set<SocketListener>>();
  private readonly subscribedOrders = new Set<string>();

  get connected(): boolean {
    return Boolean(this.socket?.connected && this.isAuthenticated);
  }

  async connect(retriedRefresh = false): Promise<void> {
    if (this.connected) return;
    this.clearReconnect();
    this.suppressReconnect = false;

    const session = await getStoredAuthSession();
    const token = session?.accessToken;
    if (!token) return;

    this.teardownSocket();

    const socket = io(SOCKET_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: false,
    });
    this.socket = socket;

    this.bindRegisteredListeners(socket);

    socket.on("authenticated", () => {
      if (this.socket !== socket) return;
      this.isAuthenticated = true;
      this.reconnectAttempts = 0;
      for (const orderId of this.subscribedOrders) {
        socket.emit("order:subscribe", { orderId });
      }
      this.dispatchLocal("authenticated", undefined);
    });

    socket.on("authentication_error", async () => {
      if (this.socket !== socket) return;
      this.isAuthenticated = false;
      this.teardownSocket();
      if (!retriedRefresh) {
        const refreshed = await authService.refresh().catch(() => null);
        if (refreshed?.tokens?.accessToken) {
          void this.connect(true);
          return;
        }
      }
      this.suppressReconnect = true;
    });

    socket.on("disconnect", () => {
      if (this.socket !== socket) return;
      this.isAuthenticated = false;
      if (!this.suppressReconnect) {
        this.scheduleReconnect();
      }
    });

    socket.on("connect_error", () => {
      if (this.socket !== socket) return;
      this.isAuthenticated = false;
      if (!this.suppressReconnect) {
        this.scheduleReconnect();
      }
    });
  }

  disconnect(): void {
    this.suppressReconnect = true;
    this.clearReconnect();
    this.isAuthenticated = false;
    this.teardownSocket();
  }

  updateLocation(payload: DriverSocketLocationPayload): boolean {
    if (!this.connected || !this.socket) return false;
    this.socket.emit("driver:location:update", payload);
    return true;
  }

  subscribeOrder(orderId: string): void {
    if (!orderId) return;
    this.subscribedOrders.add(orderId);
    if (this.connected && this.socket) {
      this.socket.emit("order:subscribe", { orderId });
    }
  }

  unsubscribeOrder(orderId: string): void {
    if (!orderId) return;
    this.subscribedOrders.delete(orderId);
    if (this.connected && this.socket) {
      this.socket.emit("order:unsubscribe", { orderId });
    }
  }

  on(event: string, listener: SocketListener): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    if (event !== "authenticated") {
      this.socket?.on(event, listener);
    }
  }

  off(event: string, listener: SocketListener): void {
    this.listeners.get(event)?.delete(listener);
    if (event !== "authenticated") {
      this.socket?.off(event, listener);
    }
  }

  private bindRegisteredListeners(socket: Socket): void {
    for (const [event, set] of this.listeners.entries()) {
      if (event === "authenticated") continue;
      for (const fn of set) {
        socket.on(event, fn);
      }
    }
  }

  private dispatchLocal(event: string, payload: unknown): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) fn(payload);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }
    const delayMs = Math.min(1000 * 2 ** this.reconnectAttempts, 20_000);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.suppressReconnect) {
        void this.connect();
      }
    }, delayMs);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private teardownSocket(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }
}

export const driverSocketService = new DriverSocketService();
