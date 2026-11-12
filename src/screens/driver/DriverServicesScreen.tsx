import {
  SegmentedControl,
  SearchField,
  useSearch,
} from "../../components/presentation";
import { OrderList } from "../../components/OrderList";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Page } from "../../components/Page";
import { Icon, Title, contentColors } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { visibleOrders } from "../../domain/repository";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import { ordersStyles } from "../../components/OrdersPresentation";
import { selectDriverServices } from "../../entities/order/model/driverOrderSelectors";
import { driverOrdersService } from "../../services/orders/driverOrdersService";
import { tactile } from "../../design-system/interaction";

export function DriverServicesScreen() {
  const navigation = useLaundryNavigation();
  const { state, execute } = useApp();
  const [upcoming, setUpcoming] = useState(false);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  const loadDriverServices = useCallback(async () => {
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
    void loadDriverServices();
  }, [loadDriverServices]);

  const query = useSearch(search);
  const orders = selectDriverServices(visibleOrders(state), upcoming, query);

  return (
    <Page scroll={false}>
      <View style={styles.headerRow}>
        <Title style={ordersStyles.screenTitle}>Mis servicios</Title>
        <View style={styles.headerBadges}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar listado de servicios"
            disabled={syncing}
            onPress={() => {
              tactile("light");
              void loadDriverServices();
            }}
            style={({ pressed }) => [
              styles.syncBadge,
              { opacity: pressed || syncing ? 0.6 : 1 },
            ]}
          >
            <Icon
              name="sync-outline"
              size={14}
              color={contentColors.primary}
            />
          </Pressable>
          <View style={styles.countBadge}>
            <Icon name="layers-outline" size={14} color={contentColors.primary} />
            <Text style={styles.countText}>
              {orders.length} {upcoming ? "próximos" : "activos"}
            </Text>
          </View>
        </View>
      </View>
      <SegmentedControl
        appearance="request"
        value={upcoming ? "next" : "active"}
        onChange={(v) => setUpcoming(v === "next")}
        options={[
          { value: "active", label: "Activos" },
          { value: "next", label: "Próximos" },
        ]}
      />
      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Buscar servicios"
      />
      <OrderList
        appearance="orders"
        orders={orders}
        onDetail={(order) =>
          navigation.navigate("DriverServiceDetail", { orderId: order.id })
        }
        onClear={() => setSearch("")}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  syncBadge: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: contentColors.soft,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: contentColors.soft,
  },
  countText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: contentColors.primary,
  },
});
