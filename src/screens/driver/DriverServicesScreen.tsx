import {
  SegmentedControl,
  SearchField,
  useSearch,
} from "../../components/presentation";
import { OrderList } from "../../components/OrderList";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Page } from "../../components/Page";
import { Icon, Title, contentColors } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { visibleOrders } from "../../domain/repository";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import { ordersStyles } from "../../components/OrdersPresentation";
import { selectDriverServices } from "../../entities/order/model/driverOrderSelectors";

export function DriverServicesScreen() {
  const navigation = useLaundryNavigation(),
    { state } = useApp();
  const [upcoming, setUpcoming] = useState(false),
    [search, setSearch] = useState("");
  const query = useSearch(search);
  const orders = selectDriverServices(visibleOrders(state), upcoming, query);
  return (
    <Page scroll={false}>
      <View style={styles.headerRow}>
        <Title style={ordersStyles.screenTitle}>Mis servicios</Title>
        <View style={styles.countBadge}>
          <Icon name="layers-outline" size={14} color={contentColors.primary} />
          <Text style={styles.countText}>
            {orders.length} {upcoming ? "próximos" : "activos"}
          </Text>
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
