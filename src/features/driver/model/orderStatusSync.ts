import { useEffect, useRef } from "react";
import { AppState as Lifecycle } from "react-native";
import { driverOrdersService } from "../../../services/orders/driverOrdersService";
import { driverSocketService } from "../../../services/realtime/driverSocketService";
import { useApp } from "../../../store/AppProvider";
import { refreshOrderFromServer, type OrderStatusChangedEvent } from "./orderStatusRefresh";

// El servidor avisa por el socket (`order:status:changed`) cuando un pedido del chofer cambia:
// el cliente lo canceló o reprogramó, la sede lo liberó o lo reasignó. La app vuelve a leer ese
// pedido y actualiza la lista sin que el chofer tenga que recargar.

const MISSING_DETAIL_RETRY_MS = 3_000;

export function useOrderStatusSync(enabled: boolean): void {
  const { state, execute } = useApp();
  const executeRef = useRef(execute);
  executeRef.current = execute;

  // Pedidos que quedaron solo con el resumen (falló su detalle): se vuelve a pedir el detalle a
  // los pocos segundos, para no mostrar "Dirección no disponible" o "Sin horario".
  const missingKey = state.orders
    .filter((o) => o.detailMissing)
    .map((o) => o.id)
    .join(",");
  useEffect(() => {
    if (!enabled || !missingKey) return;
    const timer = setTimeout(() => {
      for (const id of missingKey.split(",")) {
        void refreshOrderFromServer(id, {
          getOrder: (orderId) => driverOrdersService.getOrder(orderId),
          onUpdate: (order) => executeRef.current((repo) => repo.syncAssignedOrders([order])),
          onRemove: (orderId) => executeRef.current((repo) => repo.removeOrder(orderId)),
        });
      }
    }, MISSING_DETAIL_RETRY_MS);
    return () => clearTimeout(timer);
  }, [enabled, missingKey]);

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
      const fetchedAt = Date.now();
      void driverOrdersService
        .getAssignedOrders()
        .then((assigned) =>
          executeRef.current((repo) => {
            repo.syncAssignedOrders(assigned);
            repo.pruneUnassignedOrders(assigned.map((o) => o.id), fetchedAt);
          }),
        )
        .catch(() => {
          // Sin conexión se conserva lo último conocido.
        });
    };
    driverSocketService.on("order:status:changed", listener);
    driverSocketService.on("authenticated", resync);
    // Al volver a la app (o a la pestaña) se relee aunque el socket figure conectado: una conexión
    // que quedó colgada en segundo plano puede tardar hasta un minuto en detectarse como caída.
    const lifecycle = Lifecycle.addEventListener("change", (status) => {
      if (status === "active" && driverSocketService.connected) resync();
    });
    return () => {
      lifecycle.remove();
      driverSocketService.off("order:status:changed", listener);
      driverSocketService.off("authenticated", resync);
    };
  }, [enabled]);
}
