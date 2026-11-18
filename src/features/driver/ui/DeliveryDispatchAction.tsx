import { useState } from "react";
import { View } from "react-native";
import { Button } from "../../../components/ui";
import type { Order } from "../../../domain/models";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
import { useApp } from "../../../store/AppProvider";
import { useLiveLocation } from "../model/LiveLocationContext";
import { DriverHandoffCode } from "./DriverHandoffCode";

// Salida a reparto: el chofer retira la ropa en planta mostrando su código; la sede lo valida
// en la web y recién entonces la solicitud pasa a "En camino a entrega".
export function DeliveryDispatchAction({ order }: { order: Order }) {
  const { execute } = useApp();
  const { sendStatus } = useLiveLocation();
  const navigation = useLaundryNavigation();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ gap: 8 }}>
      <Button
        label="Mostrar código para retirar en planta"
        icon="qr-code-outline"
        haptic="medium"
        onPress={() => setOpen(true)}
      />
      <DriverHandoffCode
        order={order}
        type="FACILITY_TO_DRIVER"
        doneStatus="OUT_FOR_DELIVERY"
        title="Retiro en planta"
        description="Muestra este código o QR al personal de la sede para retirar la ropa. Cuando lo validen, saldrás hacia la entrega."
        visible={open}
        onClose={() => setOpen(false)}
        onDone={(updated) => {
          // La custodia la validó el servidor: se toma el estado confirmado.
          execute((r) =>
            r.updateOrderVersion(
              order.id,
              updated.version ?? (order.version ?? 1) + 1,
              "OUT_FOR_DELIVERY",
            ),
          );
          void sendStatus("ON_SERVICE").catch(() => {});
          setOpen(false);
          navigation.navigate("DriverMap", { orderId: order.id });
        }}
      />
    </View>
  );
}
