import { useState } from "react";
import { View } from "react-native";
import { Body, Button } from "../../../components/ui";
import type { Order } from "../../../domain/models";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
import { useApp } from "../../../store/AppProvider";
import { useLiveLocation } from "../model/LiveLocationContext";
import { DriverHandoffCode } from "./DriverHandoffCode";

// Llegada a planta: el chofer muestra su código y la sede lo valida en la web. Recién entonces
// la solicitud pasa a "En planta" y el chofer queda libre.
export function FacilityArrivalAction({ order }: { order: Order }) {
  const { execute } = useApp();
  const { sendStatus } = useLiveLocation();
  const navigation = useLaundryNavigation();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <View style={{ gap: 8 }}>
      {done ? (
        <View testID="facility_received">
          <Body>La sede recibió la ropa.</Body>
        </View>
      ) : (
        <Button
          label="Mostrar código para la sede"
          icon="qr-code-outline"
          haptic="medium"
          onPress={() => setOpen(true)}
        />
      )}
      <DriverHandoffCode
        order={order}
        type="DRIVER_TO_FACILITY"
        doneStatus="AT_FACILITY"
        title="Entrega en planta"
        description="Muestra este código o QR al personal de la sede. Cuando lo validen, la entrega quedará registrada."
        visible={open}
        onClose={() => setOpen(false)}
        onDone={(updated) => {
          execute((r) => {
            // La custodia ya la validó el servidor: el registro local no vuelve a comprobarla.
            r.driverAction(order.id, "ARRIVE_FACILITY");
            r.updateOrderVersion(order.id, updated.version ?? (order.version ?? 1) + 1, "AT_FACILITY");
          });
          void sendStatus("AVAILABLE").catch(() => {});
          setOpen(false);
          setDone(true);
          navigation.popTo("DriverRoute");
        }}
      />
    </View>
  );
}
