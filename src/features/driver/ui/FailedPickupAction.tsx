import { useState } from "react";
import { View } from "react-native";
import { BottomSheet } from "../../../components/overlay/OverlayPortal";
import { Body, Button, Choice, Field, useAction } from "../../../components/ui";
import type { Order } from "../../../domain/models";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
import { useApp } from "../../../store/AppProvider";
import {
  FAILED_PICKUP_REASONS,
  failedPickupReason,
  reportFailedPickup,
} from "../model/custody";
import { useLiveLocation } from "../model/LiveLocationContext";

// El chofer está en el domicilio pero no puede recoger. La solicitud queda retenida para que
// la sede decida si la reprograma o la cancela, y se aplica al cliente el cargo de la política.
export function FailedPickupAction({ order }: { order: Order }) {
  const { execute } = useApp();
  const { sendStatus } = useLiveLocation();
  const navigation = useLaundryNavigation();
  const a = useAction();
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState("");
  const [detail, setDetail] = useState("");

  const submit = () =>
    a.asyncRun(async () => {
      const reason = failedPickupReason(preset, detail);
      const updated = await reportFailedPickup(order, reason, (latest) =>
        execute((r) => r.syncAssignedOrders([latest])),
      );
      execute((r) =>
        r.updateOrderVersion(order.id, updated.version ?? (order.version ?? 1) + 1, "INCIDENT"),
      );
      void sendStatus("AVAILABLE").catch(() => {});
      setOpen(false);
      navigation.popTo("DriverRoute");
    }, "Recogida fallida reportada.");

  return (
    <>
      <Button
        label="Recogida fallida"
        secondary
        icon="alert-circle-outline"
        onPress={() => setOpen(true)}
      />
      <BottomSheet title="Recogida fallida" visible={open} onClose={() => setOpen(false)}>
        <View style={{ gap: 10 }}>
          <Body muted>
            Usa esta opción solo si no puedes recoger la ropa estando en el domicilio. La solicitud
            pasará a revisión de la sede y se aplicará al cliente el cargo por recogida fallida.
          </Body>
          <View accessibilityRole="radiogroup" accessibilityLabel="Motivo" style={{ gap: 8 }}>
            {FAILED_PICKUP_REASONS.map((r) => (
              <Choice key={r} label={r} selected={preset === r} onPress={() => setPreset(r)} />
            ))}
          </View>
          <Field
            label={preset === "Otro" ? "Describe qué pasó" : "Detalle (opcional)"}
            value={detail}
            onChangeText={setDetail}
            multiline
          />
          {a.feedback}
          <Button
            label="Reportar recogida fallida"
            variant="danger"
            busy={a.busy}
            onPress={() => void submit()}
          />
          <Button label="Cancelar" secondary onPress={() => setOpen(false)} />
        </View>
      </BottomSheet>
    </>
  );
}
