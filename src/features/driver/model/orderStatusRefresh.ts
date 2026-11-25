import type { Order } from "../../../domain/models";
import { ApiError } from "../../../services/api/apiClient";
import {
  mapBackendOrderToDomain,
  type BackendOrderDetails,
} from "../../../services/orders/driverOrdersService";

// Lógica sin dependencias de React Native, para poder probarla.

export interface OrderStatusChangedEvent {
  orderId: string;
  status: string;
}

/**
 * Lee el pedido del servidor y decide qué hacer con la copia del teléfono. Si el servidor ya no lo
 * muestra al chofer (404 o 403: lo liberaron), se quita de su lista.
 */
export async function refreshOrderFromServer(
  orderId: string,
  deps: {
    getOrder(id: string): Promise<BackendOrderDetails>;
    onUpdate(order: Order): void;
    onRemove(id: string): void;
  },
): Promise<"updated" | "removed" | "kept"> {
  try {
    const raw = await deps.getOrder(orderId);
    deps.onUpdate(mapBackendOrderToDomain(raw));
    return "updated";
  } catch (error) {
    if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 403)) {
      deps.onRemove(orderId);
      return "removed";
    }
    // Sin conexión: se conserva lo último conocido hasta la siguiente recarga.
    return "kept";
  }
}
