import { useState } from "react";
import type { Order } from "../../../domain/models";

import { useAction } from "../../../components/ui";
import { useApp } from "../../../store/AppProvider";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
export function useDeliveryConfirmation(order: Order | undefined) {
  const { execute } = useApp();
  const navigation = useLaundryNavigation();
  const feedbackAction = useAction();
  const [name, setName] = useState(order?.customerName ?? ""),
    [relationship, setRelationship] = useState("Cliente"),
    [notes, setNotes] = useState(""),
    [photo, setPhoto] = useState<string>(),
    [code, setCode] = useState(""),
    [checked, setChecked] = useState(false);

  const confirm = () => {
    if (!order) return;
    if (
      feedbackAction.run(
        () =>
          execute((r) =>
            r.driverConfirmDelivery(
              order.id,
              name,
              relationship,
              notes,
              photo,
              code.trim() || undefined,
            ),
          ),
        "Entrega confirmada.",
      )
    )
      navigation.popTo("DriverRoute");
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
    feedback: feedbackAction.feedback,
  };
}
