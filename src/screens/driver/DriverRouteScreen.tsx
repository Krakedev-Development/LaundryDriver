import { StyleSheet, Text, View } from "react-native";
import { Page } from "../../components/Page";
import { Button, Empty, Icon, Title, contentColors } from "../../components/ui";
import { OrderCard } from "../../components/OrderCard";
import { useApp } from "../../store/AppProvider";
import { visibleOrders } from "../../domain/repository";
import { deliveryStatuses, pickupStatuses } from "../../domain/models";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import { routeStyles } from "../../components/DriverRoutePresentation";
import { RouteAvailability } from "../../features/driver/ui/RouteAvailability";
import { NextServiceCard } from "../../features/driver/ui/NextServiceCard";

export function DriverRouteScreen() {
  const navigation = useLaundryNavigation();
  const { state } = useApp();
  const orders = visibleOrders(state).filter(
    (order) =>
      pickupStatuses.includes(order.status) ||
      deliveryStatuses.includes(order.status),
  );
  const next = orders[0];
  const remaining = orders.slice(1);

  return (
    <Page>
      <RouteAvailability orders={orders} />
      <Title style={routeStyles.section}>Siguiente servicio</Title>
      {next ? (
        <NextServiceCard order={next} />
      ) : (
        <Empty text="No hay paradas activas asignadas. Consulta los próximos servicios." />
      )}
      <View style={styles.timelineHeader}>
        <Title style={routeStyles.section}>Paradas de tu ruta</Title>
        <View style={styles.stopCountPill}>
          <Icon name="git-branch-outline" size={13} color={contentColors.primary} />
          <Text style={styles.stopCountText}>
            {orders.length} {orders.length === 1 ? "parada" : "paradas"}
          </Text>
        </View>
      </View>

      {remaining.length > 0 ? (
        <View style={styles.timelineList}>
          {remaining.map((order, idx) => {
            const isPickup = pickupStatuses.includes(order.status);
            const isLast = idx === remaining.length - 1;
            return (
              <View key={order.id} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View
                    style={[
                      styles.timelineNode,
                      isPickup ? styles.nodePickup : styles.nodeDelivery,
                    ]}
                  >
                    <Text style={styles.nodeIndex}>{idx + 2}</Text>
                  </View>
                  {!isLast && <View style={styles.timelineConnector} />}
                </View>
                <View style={styles.timelineContent}>
                  <OrderCard
                    order={order}
                    appearance="orders"
                    onDetail={() =>
                      navigation.navigate("DriverServiceDetail", {
                        orderId: order.id,
                      })
                    }
                  />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      <Button
        label="Ver todos mis servicios"
        secondary
        icon="list-outline"
        style={routeStyles.secondary}
        textStyle={routeStyles.secondaryText}
        onPress={() => navigation.navigate("DriverServices")}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  stopCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: contentColors.soft,
  },
  stopCountText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: contentColors.primary,
  },
  timelineList: {
    gap: 12,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  timelineRail: {
    width: 28,
    alignItems: "center",
  },
  timelineNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginTop: 14,
  },
  nodePickup: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  nodeDelivery: {
    backgroundColor: "#ECFCCB",
    borderColor: "#84CC16",
  },
  nodeIndex: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    minWidth: 0,
  },
});
