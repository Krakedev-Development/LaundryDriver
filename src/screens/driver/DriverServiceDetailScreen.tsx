import { Page } from "../../components/Page";
import { Empty } from "../../components/ui";
import { DemoPlantActions } from "../DemoPlantActions";
import { useApp } from "../../store/AppProvider";
import { visibleOrders } from "../../domain/repository";
import { pickupStatuses } from "../../domain/models";
import type { ScreenProps } from "../../navigation/routes";
import { DriverAction } from "../../features/driver/ui/DriverAction";
import { ServiceSummary } from "../../features/driver/ui/ServiceSummary";
import { ServiceDestination } from "../../features/driver/ui/ServiceDestination";
import { ServiceGarments } from "../../features/driver/ui/ServiceGarments";
import { ServiceReceipts } from "../../features/driver/ui/ServiceReceipts";
export function DriverServiceDetailScreen({
  route,
}: ScreenProps<"DriverServiceDetail">) {
  const { state } = useApp();
  const order = visibleOrders(state).find(
    (order) => order.id === route.params.orderId,
  );
  if (!order)
    return (
      <Page>
        <Empty text="Servicio no disponible para este chofer." />
      </Page>
    );
  const pickup = pickupStatuses.includes(order.status);
  return (
    <Page>
      <ServiceSummary order={order} pickup={pickup} />
      <ServiceDestination order={order} pickup={pickup} />
      <ServiceGarments order={order} />
      <DriverAction order={order} />
      <ServiceReceipts order={order} />
      <DemoPlantActions order={order} />
    </Page>
  );
}
