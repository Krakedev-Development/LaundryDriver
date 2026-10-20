import { Page } from "../../components/Page";
import { Button, Empty, Title } from "../../components/ui";
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
  return (
    <Page>
      <RouteAvailability orders={orders} />
      <Title style={routeStyles.section}>Siguiente servicio</Title>
      {next ? (
        <NextServiceCard order={next} />
      ) : (
        <Empty text="No hay paradas activas asignadas. Consulta los próximos servicios." />
      )}
      <Title style={routeStyles.section}>Paradas de tu ruta</Title>
      {orders.slice(1).map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          appearance="orders"
          onDetail={() =>
            navigation.navigate("DriverServiceDetail", { orderId: order.id })
          }
        />
      ))}
      <Button
        label="Ver todos mis servicios"
        secondary
        style={routeStyles.secondary}
        textStyle={routeStyles.secondaryText}
        onPress={() => navigation.navigate("DriverServices")}
      />
    </Page>
  );
}
