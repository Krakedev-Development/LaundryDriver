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
      <Title style={ordersStyles.screenTitle}>Mis servicios</Title>
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
