import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
import {
  driverOrdersService,
  GUAYAQUIL_COORDINATES,
} from "../../services/orders/driverOrdersService";
import { tactile } from "../../design-system/interaction";

export function DriverRouteScreen() {
  const navigation = useLaundryNavigation();
  const { state, execute } = useApp();
  const [syncing, setSyncing] = useState(false);

  const fetchAssignedRoute = useCallback(async () => {
    try {
      setSyncing(true);
      const assigned = await driverOrdersService.getAssignedOrders();
      if (assigned.length > 0) {
        execute((repo) => repo.syncAssignedOrders(assigned));
      }
    } catch {
      // Fallback for offline sessions
    } finally {
      setSyncing(false);
    }
  }, [execute]);

  useEffect(() => {
    void fetchAssignedRoute();
  }, [fetchAssignedRoute]);

  // Telemetría GPS periódica hacia PATCH /drivers/me/location
  useEffect(() => {
    let active = true;
    const emitLocation = async () => {
      try {
        const lat =
          state.driver.currentLat || GUAYAQUIL_COORDINATES.center.latitude;
        const lng =
          state.driver.currentLng || GUAYAQUIL_COORDINATES.center.longitude;
        await driverOrdersService.updateLocation({
          latitude: lat,
          longitude: lng,
          status: state.driver.operationalStatus,
        });
      } catch {
        // Telemetría en segundo plano no bloquea la UI
      }
    };

    void emitLocation();

    const interval = setInterval(() => {
      if (active) {
        void emitLocation();
      }
    }, 25000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [
    state.driver.currentLat,
    state.driver.currentLng,
    state.driver.operationalStatus,
  ]);

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
      <View style={styles.sectionHeaderRow}>
        <Title style={routeStyles.section}>Siguiente servicio</Title>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sincronizar ruta con el servidor"
          disabled={syncing}
          onPress={() => {
            tactile("light");
            void fetchAssignedRoute();
          }}
          style={({ pressed }) => [
            styles.syncBadge,
            { opacity: pressed || syncing ? 0.6 : 1 },
          ]}
        >
          <Icon name="sync-outline" size={12} color={contentColors.primary} />
          <Text style={styles.syncText}>
            {syncing ? "Sincronizando..." : "Actualizar"}
          </Text>
        </Pressable>
      </View>
      {next ? (
        <View style={styles.nextContainer}>
          <NextServiceCard order={next} />
          <Button
            label="Abrir mapa táctico en Guayaquil"
            icon="map-outline"
            haptic="medium"
            style={styles.mapActionBtn}
            textStyle={styles.mapActionText}
            onPress={() =>
              navigation.navigate("DriverMap", { orderId: next.id })
            }
          />
        </View>
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: contentColors.soft,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  syncText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    color: contentColors.primary,
  },
  nextContainer: {
    gap: 12,
  },
  mapActionBtn: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    paddingVertical: 14,
  },
  mapActionText: {
    color: "#F8FAFC",
    fontWeight: "700",
    fontSize: 14,
  },
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
    gap: 0,
    paddingVertical: 4,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
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
    zIndex: 2,
  },
  nodePickup: {
    backgroundColor: "#FEF3C7",
    borderColor: "#D97706",
  },
  nodeDelivery: {
    backgroundColor: "#DCFCE7",
    borderColor: "#16A34A",
  },
  nodeIndex: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
});
