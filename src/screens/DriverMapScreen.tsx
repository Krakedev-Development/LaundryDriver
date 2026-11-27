import { StatusChip } from "../components/presentation";
import { StyleSheet, Text, View } from "react-native";
import { Page } from "../components/Page";
import {
  Badge,
  Body,
  Button,
  Card,
  Empty,
  Icon,
  Title,
  contentColors,
  useAction,
} from "../components/ui";
import {
  GUAYAQUIL_BASE,
  normalizeGuayaquilCoords,
  stopKindMeta,
  type StopKind,
} from "../components/routeMapShared";
import { useApp } from "../store/AppProvider";
import { visibleOrders } from "../domain/repository";
import { orderLabel, pickupStatuses, type Order } from "../domain/models";
import { facilities } from "../domain/catalog";
import type { ScreenProps } from "../navigation/routes";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";
import {
  openGoogleMapsDirections,
  openWazeDirections,
} from "../services/navigation/externalMaps";

function destinationFor(order: Order): {
  latitude: number;
  longitude: number;
  addressFull: string;
  stopKind: StopKind;
} {
  if (["PICKED_UP", "HEADING_TO_FACILITY"].includes(order.status)) {
    const f = facilities.find(
      (f) => f.name === order.facilityName || f.id === order.facilityName,
    );
    return {
      latitude: f?.latitude ?? GUAYAQUIL_BASE.latitude,
      longitude: f?.longitude ?? GUAYAQUIL_BASE.longitude,
      addressFull:
        f?.address ?? (order.facilityName || "Planta Central Guayaquil"),
      stopKind: "FACILITY",
    };
  }
  const isPickup = pickupStatuses.includes(order.status);
  const leg = isPickup
    ? order.fulfillmentPlan.inbound
    : order.fulfillmentPlan.outbound;
  return {
    latitude: leg.latitude || GUAYAQUIL_BASE.latitude,
    longitude: leg.longitude || GUAYAQUIL_BASE.longitude,
    addressFull:
      leg.addressFull ||
      (isPickup ? "Punto de recogida Guayaquil" : "Punto de entrega Guayaquil"),
    stopKind: isPickup ? "PICKUP" : "DELIVERY",
  };
}

export function DriverMapScreen({ route }: ScreenProps<"DriverMap">) {
  const navigation = useLaundryNavigation();
  const { state } = useApp();
  const o = visibleOrders(state).find((o) => o.id === route.params.orderId);
  // El chofer navega con Google Maps o Waze: la app no muestra un mapa propio.
  const a = useAction();
  if (!o)
    return (
      <Page>
        <Empty text="Servicio no disponible." />
      </Page>
    );
  const destination = destinationFor(o),
    d = state.driver;
  const normalized = normalizeGuayaquilCoords(
    { latitude: d.currentLat, longitude: d.currentLng },
    destination,
  );
  const meta = stopKindMeta(destination.stopKind);

  return (
    <Page>
      <Card style={styles.telemetryCard}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Title>{orderLabel(o)}</Title>
            <View
              style={[
                styles.stopTypeBadge,
                { backgroundColor: meta.ringBg, borderColor: meta.color },
              ]}
            >
              <Icon name={meta.icon} size={13} color={contentColors.primary} />
              <Text style={styles.stopTypeText}>{meta.label}</Text>
            </View>
          </View>
          <StatusChip status={o.status} />
        </View>

        <View style={styles.addressBox}>
          <Icon
            name="location-outline"
            size={18}
            color={contentColors.primary}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Body style={styles.addressText}>{destination.addressFull}</Body>
            <Text style={styles.coordsText}>
              Coordenadas ({normalized.destination.latitude.toFixed(4)},{" "}
              {normalized.destination.longitude.toFixed(4)})
            </Text>
          </View>
        </View>

        <View style={styles.badgesRow}>
          <Badge>Navegación GPS externa</Badge>
          <Badge>{d.vehiclePlate}</Badge>
        </View>

        <Body muted>
          Elige una aplicación de navegación para calcular el recorrido real.
        </Body>
        {a.feedback}

        <View style={styles.gpsGrid}>
          <Button
            label="Navegar con Google Maps"
            busy={a.busy}
            haptic="medium"
            icon="navigate-outline"
            style={styles.googleMapsBtn}
            onPress={() => {
              void a.asyncRun(() =>
                openGoogleMapsDirections(
                  normalized.destination.latitude,
                  normalized.destination.longitude,
                ),
              );
            }}
          />
          <Button
            label="Navegar con Waze"
            busy={a.busy}
            secondary
            haptic="medium"
            icon="compass-outline"
            style={styles.wazeBtn}
            textStyle={styles.wazeBtnText}
            onPress={() => {
              void a.asyncRun(() =>
                openWazeDirections(
                  normalized.destination.latitude,
                  normalized.destination.longitude,
                ),
              );
            }}
          />
        </View>

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

const styles = StyleSheet.create({
  telemetryCard: {
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: contentColors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stopTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  stopTypeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    color: contentColors.text,
    letterSpacing: 0.3,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: contentColors.soft,
  },
  addressText: {
    fontWeight: "700",
    color: contentColors.text,
  },
  coordsText: {
    fontSize: 12,
    lineHeight: 16,
    color: contentColors.muted,
    fontWeight: "500",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gpsGrid: {
    gap: 10,
  },
  googleMapsBtn: {
    backgroundColor: contentColors.primary,
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
