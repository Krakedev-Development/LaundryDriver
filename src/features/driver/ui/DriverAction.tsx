import { View } from "react-native";
import { Button, type IconName, useAction } from "../../../components/ui";
import { useApp } from "../../../store/AppProvider";
import { useLiveLocation } from "../model/LiveLocationContext";
import { advanceOnServer, isServerAction } from "../model/serverTransitions";
import { FailedPickupAction } from "./FailedPickupAction";
import { FacilityArrivalAction } from "./FacilityArrivalAction";
import { DeliveryDispatchAction } from "./DeliveryDispatchAction";
import { type Order } from "../../../domain/models";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";

export function DriverAction({ order }: { order: Order }) {
  const { execute, state } = useApp();
  const { sendStatus } = useLiveLocation();
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
    // En planta (HEADING_TO_FACILITY y DELIVERY_ASSIGNED) los traspasos se validan con código:
    // ver FacilityArrivalAction y DeliveryDispatchAction.
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
              const step = action[1];
              if (isServerAction(step)) {
                // Primero el servidor: el teléfono solo avanza si el servidor lo registró.
                if (
                  ["BREAK", "OFFLINE"].includes(state.driver.operationalStatus)
                )
                  throw Error(
                    "Ponte disponible antes de continuar el servicio.",
                  );
                const synced = await advanceOnServer(order, step, (latest) =>
                  execute((r) => r.syncAssignedOrders([latest])),
                );
                execute((r) => {
                  r.driverAction(order.id, step);
                  // Del servidor se toman el estado y la versión confirmados.
                  r.updateOrderVersion(
                    order.id,
                    synced.version ?? (order.version ?? 1) + 1,
                    synced.status,
                  );
                });
                void sendStatus("ON_SERVICE").catch(() => {});
                if (step === "START_PICKUP")
                  navigation.navigate("DriverMap", { orderId: order.id });
                return;
              }
              // Toda acción del chofer pasa por el servidor o por la custodia: nada avanza solo aquí.
              throw Error("Esta acción no está disponible.");
            });
          }}
        />
      )}
      {order.status === "ARRIVED_FOR_PICKUP" && (
        <>
          <Button
            label="Confirmar recogida de prendas"
            icon="cube-outline"
            haptic="medium"
            onPress={() =>
              navigation.navigate("DriverPickupConfirm", { orderId: order.id })
            }
          />
          <FailedPickupAction order={order} />
        </>
      )}
      {order.status === "DELIVERY_ASSIGNED" && (
        <DeliveryDispatchAction order={order} />
      )}
      {order.status === "OUT_FOR_DELIVERY" && (
        <Button
          label="Abrir navegación"
          icon="navigate-outline"
          secondary
          onPress={() => navigation.navigate("DriverMap", { orderId: order.id })}
        />
      )}
      {order.status === "HEADING_TO_FACILITY" && (
        <FacilityArrivalAction order={order} />
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
