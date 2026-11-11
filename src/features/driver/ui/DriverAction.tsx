import { View } from "react-native";
import { Button, type IconName, useAction } from "../../../components/ui";
import { useApp } from "../../../store/AppProvider";
import { type Order } from "../../../domain/models";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
import { driverOrdersService } from "../../../services/orders/driverOrdersService";

export function DriverAction({ order }: { order: Order }) {
  const { execute } = useApp();
  const navigation = useLaundryNavigation();
  const feedbackAction = useAction();
  const actions: Partial<
    Record<
      Order["status"],
      readonly [
        string,
        (
          | "START_PICKUP"
          | "ARRIVE_PICKUP"
          | "GO_FACILITY"
          | "ARRIVE_FACILITY"
          | "START_DELIVERY"
          | "ARRIVE_DELIVERY"
        ),
        IconName,
      ]
    >
  > = {
    PICKUP_ASSIGNED: [
      "Iniciar navegación de recogida",
      "START_PICKUP",
      "navigate-outline",
    ],
    HEADING_TO_PICKUP: [
      "Marcar llegada al domicilio",
      "ARRIVE_PICKUP",
      "location-outline",
    ],
    PICKED_UP: ["Ir a planta central", "GO_FACILITY", "business-outline"],
    HEADING_TO_FACILITY: [
      "Confirmar entrega en planta",
      "ARRIVE_FACILITY",
      "checkmark-done-outline",
    ],
    DELIVERY_ASSIGNED: [
      "Iniciar navegación de entrega",
      "START_DELIVERY",
      "navigate-outline",
    ],
    OUT_FOR_DELIVERY: [
      "Marcar llegada a entrega",
      "ARRIVE_DELIVERY",
      "flag-outline",
    ],
  };
  const action = actions[order.status];
  return (
    <View style={{ gap: 10 }}>
      {feedbackAction.feedback}
      {action && (
        <Button
          label={action[0]}
          icon={action[2]}
          haptic="medium"
          busy={feedbackAction.busy}
          onPress={() => {
            void feedbackAction.asyncRun(async () => {
              if (action[1] === "ARRIVE_FACILITY") {
                try {
                  const updated =
                    await driverOrdersService.confirmFacilityArrival(
                      order.id,
                      order.version ?? 1,
                      "Entrega en planta central confirmada",
                    );
                  if (updated?.version) {
                    execute((r) =>
                      r.updateOrderVersion(
                        order.id,
                        updated.version,
                        "AT_FACILITY",
                      ),
                    );
                  }
                } catch {
                  // Fallback for offline testing
                }
              }
              execute((r) => r.driverAction(order.id, action[1]));
              if (["START_PICKUP", "START_DELIVERY"].includes(action[1])) {
                navigation.navigate("DriverMap", { orderId: order.id });
              }
            });
          }}
        />
      )}
      {order.status === "ARRIVED_FOR_PICKUP" && (
        <Button
          label="Confirmar recogida de prendas"
          icon="cube-outline"
          haptic="medium"
          onPress={() =>
            navigation.navigate("DriverPickupConfirm", { orderId: order.id })
          }
        />
      )}
      {order.status === "ARRIVED_FOR_DELIVERY" && (
        <Button
          label="Confirmar entrega al cliente"
          icon="checkmark-circle-outline"
          haptic="medium"
          onPress={() =>
            navigation.navigate("DriverDeliveryConfirm", { orderId: order.id })
          }
        />
      )}
    </View>
  );
}
