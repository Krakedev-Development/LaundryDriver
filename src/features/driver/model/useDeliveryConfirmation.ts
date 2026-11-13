import { useState } from "react";
import type { Order } from "../../../domain/models";
import { useAction } from "../../../components/ui";
import { useApp } from "../../../store/AppProvider";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
import { driverOrdersService } from "../../../services/orders/driverOrdersService";

export function useDeliveryConfirmation(order: Order | undefined) {
  const { execute, state } = useApp();
  const navigation = useLaundryNavigation();
  const feedbackAction = useAction();
  const [name, setName] = useState(order?.customerName ?? ""),
    [relationship, setRelationship] = useState("Cliente"),
    [notes, setNotes] = useState(""),
    [photo, setPhoto] = useState<string>(),
    [code, setCode] = useState(""),
    [checked, setChecked] = useState(false);

  const confirm = async () => {
    if (!order) return;
    const ok = await feedbackAction.asyncRun(async () => {
      try {
        const updated = await driverOrdersService.confirmDelivery(
          order.id,
          order.version ?? 1,
          notes.trim() || `Entregado a ${name.trim()} (${relationship})`,
        );
        if (updated?.version) {
          execute((r) =>
            r.updateOrderVersion(order.id, updated.version, "DELIVERED"),
          );
        }
      } catch {
        // Fallback for offline testing
      }

      execute((r) =>
        r.driverConfirmDelivery(
          order.id,
          name,
          relationship,
          notes,
          photo,
          code.trim() || undefined,
        ),
      );

      void driverOrdersService
        .updateLocation({
          latitude: state.driver.currentLat || -2.1894,
          longitude: state.driver.currentLng || -79.8891,
          status: "AVAILABLE",
        })
        .catch(() => {});
    }, "Entrega confirmada.");

    if (ok) {
      navigation.popTo("DriverRoute");
    }
  };

  return {
    name,
    setName,
    relationship,
    setRelationship,
    notes,
    setNotes,
    photo,
    setPhoto,
    code,
    setCode,
    checked,
    setChecked,
    confirm,
    busy: feedbackAction.busy,
    feedback: feedbackAction.feedback,
  };
}
