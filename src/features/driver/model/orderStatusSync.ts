import { useEffect, useRef } from "react";
import { driverOrdersService } from "../../../services/orders/driverOrdersService";
import { driverSocketService } from "../../../services/realtime/driverSocketService";
import { useApp } from "../../../store/AppProvider";
import { refreshOrderFromServer, type OrderStatusChangedEvent } from "./orderStatusRefresh";

// El servidor avisa por el socket (`order:status:changed`) cuando un pedido del chofer cambia:
// el cliente lo canceló o reprogramó, la sede lo liberó o lo reasignó. La app vuelve a leer ese
// pedido y actualiza la lista sin que el chofer tenga que recargar.

export function useOrderStatusSync(enabled: boolean): void {
  const { execute } = useApp();
  const executeRef = useRef(execute);
  executeRef.current = execute;

  useEffect(() => {
    if (!enabled) return;
    const listener = (payload: unknown) => {
      const event = payload as OrderStatusChangedEvent | null;
      if (!event?.orderId) return;
      void refreshOrderFromServer(event.orderId, {
        getOrder: (id) => driverOrdersService.getOrder(id),
        onUpdate: (order) => executeRef.current((repo) => repo.syncAssignedOrders([order])),
        onRemove: (id) => executeRef.current((repo) => repo.removeOrder(id)),
      });
    };
    // Cada (re)conexión autenticada relee los pedidos asignados: mientras no había conexión se
    // pudieron perder avisos (asignaciones nuevas, cancelaciones, liberaciones).
    const resync = () => {
      void driverOrdersService
        .getAssignedOrders()
        .then((assigned) =>
          executeRef.current((repo) => {
            repo.syncAssignedOrders(assigned);
            repo.pruneUnassignedOrders(assigned.map((o) => o.id));
          }),
        )
        .catch(() => {
          // Sin conexión se conserva lo último conocido.
        });
    };
    driverSocketService.on("order:status:changed", listener);
    driverSocketService.on("authenticated", resync);
    return () => {
      driverSocketService.off("order:status:changed", listener);
      driverSocketService.off("authenticated", resync);
    };
  }, [enabled]);
}
