import { useState } from "react";
import type { Order } from "../../../domain/models";
import { useAction } from "../../../components/ui";
import { useApp } from "../../../store/AppProvider";
import { useLiveLocation } from "./LiveLocationContext";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
import { parseCustodyInput, verifyCustody } from "./custody";

export function useDeliveryConfirmation(order: Order | undefined) {
  const { execute } = useApp();
  const { sendStatus } = useLiveLocation();
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
      // Quien recibe es obligatorio y la entrega se valida en el servidor con el código o QR
      // que muestra el cliente en su app.
      if (!name.trim()) throw Error("Escribe el nombre de quien recibe.");
      if (!relationship.trim()) throw Error("Indica la relación de quien recibe con el cliente.");
      const input = parseCustodyInput(code, order.id, "DRIVER_TO_CUSTOMER");
      const updated = await verifyCustody(
        order,
        "DRIVER_TO_CUSTOMER",
        input,
        {
          recipientName: name.trim(),
          recipientRelationship: relationship.trim(),
          notes: notes.trim() || undefined,
        },
        (latest) => execute((r) => r.syncAssignedOrders([latest])),
      );
      execute((r) => {
        // El código ya lo validó el servidor: el registro local no lo vuelve a comprobar.
        r.driverConfirmDelivery(order.id, name, relationship, notes, photo);
        r.updateOrderVersion(
          order.id,
          updated.version ?? (order.version ?? 1) + 1,
          "DELIVERED",
        );
      });

      // Con la ubicación real si la hay; sin GPS se envía solo el estado.
      void sendStatus("AVAILABLE").catch(() => {});
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
