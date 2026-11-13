import { StyleSheet, View } from "react-native";
import { Body, Button, Card } from "../../../components/ui";
import { type Order } from "../../../domain/models";
import {
  DriverSectionTitle,
  DriverServiceMeta,
  driverServiceStyles,
} from "../../../components/DriverServicePresentation";
import {
  openGoogleMapsDirections,
  openWazeDirections,
  resolveOrderNavigationTarget,
} from "../../../services/navigation/externalMaps";

export function ServiceDestination({
  order,
  pickup,
}: {
  order: Order;
  pickup: boolean;
}) {
  const destination = pickup ? order.pickup : order.delivery;
  const navTarget = resolveOrderNavigationTarget(order);

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
      <View style={styles.actions}>
        <Button
          label="Ir con Google Maps"
          icon="navigate-outline"
          haptic="medium"
          style={styles.googleMapsBtn}
          onPress={() => {
            void openGoogleMapsDirections(
              navTarget.latitude,
              navTarget.longitude,
            );
          }}
        />
        <Button
          label="Ir con Waze"
          icon="compass-outline"
          secondary
          haptic="medium"
          style={styles.wazeBtn}
          textStyle={styles.wazeBtnText}
          onPress={() => {
            void openWazeDirections(navTarget.latitude, navTarget.longitude);
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8,
    marginTop: 4,
  },
  googleMapsBtn: {
    borderRadius: 12,
  },
  wazeBtn: {
    backgroundColor: "#F0F9FF",
    borderColor: "#38BDF8",
    borderWidth: 1.5,
    borderRadius: 12,
  },
  wazeBtnText: {
    color: "#0369A1",
    fontWeight: "700",
  },
});
