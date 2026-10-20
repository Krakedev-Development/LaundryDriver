import { useState } from "react";
import type { Order } from "../../../domain/models";
import { garmentCount } from "../../../domain/models";
import { useAction } from "../../../components/ui";
import { useApp } from "../../../store/AppProvider";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
export function usePickupConfirmation(order: Order | undefined) {
  const { execute } = useApp();
  const navigation = useLaundryNavigation();
  const feedbackAction = useAction();
  const [checked, setChecked] = useState(false),
    [count, setCount] = useState(
      String(order ? Math.max(1, garmentCount(order)) : 1),
    ),
    [notes, setNotes] = useState(""),
    [photo, setPhoto] = useState<string>(),
    [code, setCode] = useState("");

  const confirm = () => {
    if (!order) return;
    if (
      feedbackAction.run(
        () =>
          execute((r) =>
            r.driverConfirmPickup(
              order.id,
              Number(count),
              notes,
              photo,
              code.trim() || undefined,
            ),
          ),
        "Recogida confirmada.",
      )
    )
      navigation.popTo("DriverRoute");
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
    feedback: feedbackAction.feedback,
  };
}
