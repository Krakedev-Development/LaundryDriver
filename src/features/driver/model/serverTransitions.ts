import type { Order, OrderStatus } from "../../../domain/models";
import { ApiError } from "../../../services/api/apiClient";
import {
  driverOrdersService,
  mapBackendOrderToDomain,
} from "../../../services/orders/driverOrdersService";

// Avances del chofer que el servidor acepta sin código de custodia. El estado del teléfono solo
// cambia cuando el servidor confirma: así el cliente y administración ven el mismo avance.
export const SERVER_TRANSITIONS = {
  START_PICKUP: {
    from: "PICKUP_ASSIGNED",
    to: "HEADING_TO_PICKUP",
    note: "Chofer en camino a recoger",
  },
  ARRIVE_PICKUP: {
    from: "HEADING_TO_PICKUP",
    to: "ARRIVED_FOR_PICKUP",
    note: "Chofer llegó al domicilio",
  },
  GO_FACILITY: {
    from: "PICKED_UP",
    to: "HEADING_TO_FACILITY",
    note: "Chofer en camino a la planta",
  },
  ARRIVE_DELIVERY: {
    from: "OUT_FOR_DELIVERY",
    to: "ARRIVED_FOR_DELIVERY",
    note: "Chofer llegó al punto de entrega",
  },
} as const satisfies Record<
  string,
  { from: OrderStatus; to: OrderStatus; note: string }
>;

export type ServerAction = keyof typeof SERVER_TRANSITIONS;

export const isServerAction = (action: string): action is ServerAction =>
  action in SERVER_TRANSITIONS;

export const CONFLICT_MESSAGE =
  "La solicitud cambió en el servidor. Ya se actualizó: revisa su estado e intenta de nuevo.";
export const OFFLINE_MESSAGE =
  "Sin conexión: el avance no se registró. Intenta de nuevo cuando tengas señal.";

/**
 * Registra el avance en el servidor y devuelve la solicitud actualizada para guardarla en el
 * teléfono. Si la versión no coincide, devuelve además la solicitud vigente para refrescarla y
 * lanza un error con mensaje claro. Nunca avanza solo en el teléfono.
 */
export async function advanceOnServer(
  order: Pick<Order, "id" | "status" | "version">,
  action: ServerAction,
  onRefresh: (latest: Order) => void,
): Promise<Order> {
  const { from, to, note } = SERVER_TRANSITIONS[action];
  if (order.status !== from)
    throw Error("La acción no corresponde al estado actual.");
  try {
    const updated = await driverOrdersService.transitionOrder(
      order.id,
      to,
      order.version ?? 1,
      note,
    );
    return mapBackendOrderToDomain(updated);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 0)
      throw Error(OFFLINE_MESSAGE);
    if (error instanceof ApiError && error.statusCode === 409) {
      // Otro cambio se adelantó (o el teléfono tenía una versión vieja): se trae la vigente.
      try {
        onRefresh(
          mapBackendOrderToDomain(await driverOrdersService.getOrder(order.id)),
        );
      } catch {
        // Si tampoco se puede recargar, el mensaje igual pide revisar la solicitud.
      }
      throw Error(CONFLICT_MESSAGE);
    }
    throw error;
  }
}
