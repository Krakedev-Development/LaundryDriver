import { View } from "react-native";
import { Button, useAction } from "../../../components/ui";
import { useApp } from "../../../store/AppProvider";
import { type Order } from "../../../domain/models";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
export function DriverAction({ order }: { order: Order }) {
  const { execute } = useApp();
  const navigation = useLaundryNavigation();
  const feedbackAction = useAction();
  const actions = {
    PICKUP_ASSIGNED: ["Iniciar navegación de recogida", "START_PICKUP"],
    HEADING_TO_PICKUP: ["Marcar llegada al domicilio", "ARRIVE_PICKUP"],
    PICKED_UP: ["Ir a planta central", "GO_FACILITY"],
    HEADING_TO_FACILITY: ["Confirmar entrega en planta", "ARRIVE_FACILITY"],
    DELIVERY_ASSIGNED: ["Iniciar navegación de entrega", "START_DELIVERY"],
    OUT_FOR_DELIVERY: ["Marcar llegada a entrega", "ARRIVE_DELIVERY"],
  } as const;
  const action = actions[order.status as keyof typeof actions];
  return (
    <View style={{ gap: 10 }}>
      {feedbackAction.feedback}
      {action && (
        <Button
          label={action[0]}
          onPress={() => {
            if (
              feedbackAction.run(() =>
                execute((r) => r.driverAction(order.id, action[1])),
              ) &&
              ["START_PICKUP", "START_DELIVERY"].includes(action[1])
            )
              navigation.navigate("DriverMap", { orderId: order.id });
          }}
        />
      )}
      {order.status === "ARRIVED_FOR_PICKUP" && (
        <Button
          label="Confirmar recogida de prendas"
          onPress={() =>
            navigation.navigate("DriverPickupConfirm", { orderId: order.id })
          }
        />
      )}
      {order.status === "ARRIVED_FOR_DELIVERY" && (
        <Button
          label="Confirmar entrega al cliente"
          onPress={() =>
            navigation.navigate("DriverDeliveryConfirm", { orderId: order.id })
          }
        />
      )}
    </View>
  );
}
