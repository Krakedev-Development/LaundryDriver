import { useState } from "react";
import type { Order } from "../../../domain/models";
import { garmentCount } from "../../../domain/models";
import { useAction } from "../../../components/ui";
import { useApp } from "../../../store/AppProvider";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
import { driverOrdersService } from "../../../services/orders/driverOrdersService";

export function usePickupConfirmation(order: Order | undefined) {
  const { execute, state } = useApp();
  const navigation = useLaundryNavigation();
  const feedbackAction = useAction();
  const [checked, setChecked] = useState(false),
    [count, setCount] = useState(
      String(order ? Math.max(1, garmentCount(order)) : 1),
    ),
    [notes, setNotes] = useState(""),
    [photo, setPhoto] = useState<string>(),
    [code, setCode] = useState(""),
    [pickedUpConfirmed, setPickedUpConfirmed] = useState(false);

  const confirm = async () => {
    if (!order) return;
    const ok = await feedbackAction.asyncRun(async () => {
      try {
        const updated = await driverOrdersService.confirmPickup(
          order.id,
          order.version ?? 1,
          notes.trim() || `${count} prendas recogidas`,
        );
        if (updated?.version) {
          execute((r) =>
            r.updateOrderVersion(order.id, updated.version, "PICKED_UP"),
          );
        }
      } catch {
        // Fallback for offline testing
      }

      execute((r) =>
        r.driverConfirmPickup(
          order.id,
          Number(count),
          notes,
          photo,
          code.trim() || undefined,
        ),
      );

      void driverOrdersService
        .updateLocation({
          latitude: state.driver.currentLat || -2.1894,
          longitude: state.driver.currentLng || -79.8891,
          status: "ON_SERVICE",
        })
        .catch(() => {});
    }, "Recogida confirmada.");

    if (ok) {
      setPickedUpConfirmed(true);
    }
  };

  const markFacilityArrival = async () => {
    if (!order) return;
    const ok = await feedbackAction.asyncRun(async () => {
      try {
        const updated = await driverOrdersService.confirmFacilityArrival(
          order.id,
          (order.version ?? 1) + 1,
          "Llegada a planta central confirmada",
        );
        if (updated?.version) {
          execute((r) =>
            r.updateOrderVersion(order.id, updated.version, "AT_FACILITY"),
          );
        }
      } catch {
        // Fallback for offline testing
      }

      execute((r) => {
        const currentOrder = r.state.orders.find((o) => o.id === order.id);
        if (currentOrder?.status === "PICKED_UP") {
          r.driverAction(order.id, "GO_FACILITY");
        }
        r.driverAction(order.id, "ARRIVE_FACILITY");
      });

      void driverOrdersService
        .updateLocation({
          latitude: state.driver.currentLat || -2.1894,
          longitude: state.driver.currentLng || -79.8891,
          status: "AVAILABLE",
        })
        .catch(() => {});
    }, "Llegada a planta registrada.");

    if (ok) {
      navigation.popTo("DriverRoute");
    }
  };

  return {
    checked,
    setChecked,
    count,
    setCount,
    notes,
    setNotes,
    photo,
    setPhoto,
    code,
    setCode,
    confirm,
    markFacilityArrival,
    pickedUpConfirmed,
    busy: feedbackAction.busy,
    feedback: feedbackAction.feedback,
  };
}
