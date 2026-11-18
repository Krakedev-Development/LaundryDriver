import { useState } from "react";
import type { Order } from "../../../domain/models";
import { garmentCount } from "../../../domain/models";
import { useAction } from "../../../components/ui";
import { useApp } from "../../../store/AppProvider";
import { useLiveLocation } from "./LiveLocationContext";
import { parseCustodyInput, verifyCustody } from "./custody";
import { advanceOnServer } from "./serverTransitions";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";

export function usePickupConfirmation(order: Order | undefined) {
  const { execute, state } = useApp();
  const { sendStatus } = useLiveLocation();
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
      // La custodia se valida en el servidor con el código o QR del cliente; la cantidad de
      // prendas recibidas es obligatoria y queda registrada en el traspaso.
      const declared = Number(count);
      if (!Number.isSafeInteger(declared) || declared <= 0)
        throw Error("Ingresa cuántas prendas recibes.");
      const input = parseCustodyInput(code, order.id, "CUSTOMER_TO_DRIVER");
      const updated = await verifyCustody(
        order,
        "CUSTOMER_TO_DRIVER",
        input,
        {
          declaredCount: declared,
          notes: notes.trim() || undefined,
        },
        (latest) => execute((r) => r.syncAssignedOrders([latest])),
      );
      execute((r) => {
        // El código ya lo validó el servidor: el registro local no lo vuelve a comprobar.
        r.driverConfirmPickup(order.id, declared, notes, photo);
        r.updateOrderVersion(
          order.id,
          updated.version ?? (order.version ?? 1) + 1,
          "PICKED_UP",
        );
      });

      // Con la ubicación real si la hay; sin GPS se envía solo el estado.
      void sendStatus("ON_SERVICE").catch(() => {});
    }, "Recogida confirmada.");

    if (ok) {
      setPickedUpConfirmed(true);
    }
  };

  // Tras recoger, el chofer sale hacia la planta: se registra en el servidor. Al llegar, la
  // entrega se valida con su código desde la ruta ("Mostrar código para la sede").
  const startFacilityTrip = async () => {
    if (!order) return;
    const ok = await feedbackAction.asyncRun(async () => {
      const current = state.orders.find((o) => o.id === order.id) ?? order;
      if (current.status === "PICKED_UP") {
        const synced = await advanceOnServer(current, "GO_FACILITY", (latest) =>
          execute((r) => r.syncAssignedOrders([latest])),
        );
        execute((r) => {
          r.driverAction(order.id, "GO_FACILITY");
          r.updateOrderVersion(
            order.id,
            synced.version ?? (current.version ?? 1) + 1,
            synced.status,
          );
        });
      }
      void sendStatus("ON_SERVICE").catch(() => {});
    }, "En camino a planta.");

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
    startFacilityTrip,
    pickedUpConfirmed,
    busy: feedbackAction.busy,
    feedback: feedbackAction.feedback,
  };
}
