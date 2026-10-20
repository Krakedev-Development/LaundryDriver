import { Body, Button, Card } from "../../../components/ui";
import { type Order } from "../../../domain/models";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
import {
  DriverSectionTitle,
  DriverServiceMeta,
  driverServiceStyles,
} from "../../../components/DriverServicePresentation";
export function ServiceDestination({
  order,
  pickup,
}: {
  order: Order;
  pickup: boolean;
}) {
  const navigation = useLaundryNavigation();
  const destination = pickup ? order.pickup : order.delivery;
  return (
    <Card style={driverServiceStyles.card}>
      <DriverSectionTitle icon="location-outline">
        Dirección de destino
      </DriverSectionTitle>
      <Body style={driverServiceStyles.text}>{destination.addressFull}</Body>
      <DriverServiceMeta icon="time-outline">
        <Body muted style={driverServiceStyles.text}>
          {destination.date} · {destination.timeSlot}
        </Body>
      </DriverServiceMeta>
      {pickup && order.pickup.notes && (
        <Body style={driverServiceStyles.notice}>
          Instrucciones: {order.pickup.notes}
        </Body>
      )}
      <Button
        label="Ver mapa y navegación"
        icon="map-outline"
        secondary
        variant="primary"
        style={driverServiceStyles.primary}
        onPress={() => navigation.navigate("DriverMap", { orderId: order.id })}
      />
    </Card>
  );
}
