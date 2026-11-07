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
import { selectDriverHistory } from "../../entities/order/model/driverOrderSelectors";

export function DriverHistoryScreen() {
  const navigation = useLaundryNavigation();
  const { state } = useApp();
  const [filter, setFilter] = useState("Todos"),
    [search, setSearch] = useState("");
  const query = useSearch(search);
  const orders = selectDriverHistory(visibleOrders(state), filter, query);
  return (
    <Page scroll={false}>
      <View style={styles.headerRow}>
        <Title style={ordersStyles.screenTitle}>Historial de servicios</Title>
        <View style={styles.countBadge}>
          <Icon
            name="checkmark-done-outline"
            size={14}
            color={contentColors.success}
          />
          <Text style={styles.countText}>
            {orders.length} {orders.length === 1 ? "registro" : "registros"}
          </Text>
        </View>
      </View>
      <SegmentedControl
        appearance="classic"
        value={filter}
        onChange={setFilter}
        options={["Hoy", "Esta semana", "Todos"].map((f) => ({
          value: f,
          label: f,
        }))}
      />
      <SearchField
        appearance="classic"
        value={search}
        onChange={setSearch}
        placeholder="Buscar en historial"
      />
      <OrderList
        appearance="orders"
        orders={orders}
        onDetail={(order) =>
          navigation.navigate("DriverServiceDetail", { orderId: order.id })
        }
        onClear={() => {
          setSearch("");
          setFilter("Todos");
        }}
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
    backgroundColor: contentColors.successSoft,
  },
  countText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: contentColors.success,
  },
});
