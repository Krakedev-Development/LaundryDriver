import {
  SegmentedControl,
  SearchField,
  useSearch,
} from "../../components/presentation";
import { OrderList } from "../../components/OrderList";
import { useState } from "react";
import { Page } from "../../components/Page";
import { Title } from "../../components/ui";
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
      <Title style={ordersStyles.screenTitle}>Historial de servicios</Title>
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
