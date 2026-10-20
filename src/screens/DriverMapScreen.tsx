import { StatusChip } from "../components/presentation";
import { Linking, useWindowDimensions } from "react-native";
import { Page } from "../components/Page";
import {
  Badge,
  Body,
  Button,
  Card,
  Empty,
  Title,
  useAction,
} from "../components/ui";
import RouteMap from "../components/RouteMap";
import { useApp } from "../store/AppProvider";
import { visibleOrders } from "../domain/repository";
import { pickupStatuses, type Order } from "../domain/models";
import { facilities } from "../domain/catalog";
import type { ScreenProps } from "../navigation/routes";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";
function destinationFor(order: Order) {
  if (["PICKED_UP", "HEADING_TO_FACILITY"].includes(order.status)) {
    const f =
      facilities.find((f) => f.name === order.facilityName) ?? facilities[0];
    return {
      latitude: f.latitude,
      longitude: f.longitude,
      addressFull: f.address,
    };
  }
  return pickupStatuses.includes(order.status)
    ? order.fulfillmentPlan.inbound
    : order.fulfillmentPlan.outbound;
}
export function DriverMapScreen({ route }: ScreenProps<"DriverMap">) {
  const navigation = useLaundryNavigation();
  const { state } = useApp();
  const o = visibleOrders(state).find((o) => o.id === route.params.orderId);
  const a = useAction(),
    { height } = useWindowDimensions();
  if (!o)
    return (
      <Page>
        <Empty text="Servicio no disponible." />
      </Page>
    );
  const destination = destinationFor(o),
    d = state.driver;
  return (
    <Page>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <RouteMap
          height={Math.max(230, Math.min(420, height * 0.45))}
          origin={{ latitude: d.currentLat, longitude: d.currentLng }}
          destination={destination}
        />
      </Card>
      <Card>
        <Title>{o.id}</Title>
        <StatusChip status={o.status} />
        <Body>{destination.addressFull}</Body>
        <Badge>Mapa de posición y ruta demo</Badge>
        <Body muted>
          Elige una aplicación de navegación para calcular el recorrido real.
        </Body>
        {a.feedback}
        <Button
          label="Navegar con Google Maps"
          busy={a.busy}
          icon="navigate-outline"
          onPress={() => {
            void a.asyncRun(() =>
              Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`,
              ),
            );
          }}
        />
        <Button
          label="Navegar con Waze"
          busy={a.busy}
          secondary
          onPress={() => {
            void a.asyncRun(() =>
              Linking.openURL(
                `https://waze.com/ul?ll=${destination.latitude},${destination.longitude}&navigate=yes`,
              ),
            );
          }}
        />
        <Button
          label="Abrir chat con el cliente"
          secondary
          icon="chatbubble-outline"
          onPress={() => navigation.navigate("Chat", { orderId: o.id })}
        />
      </Card>
    </Page>
  );
}
