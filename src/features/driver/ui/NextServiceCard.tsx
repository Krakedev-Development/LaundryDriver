import { StatusChip } from "../../../components/presentation";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Icon,
  Title,
  contentColors,
} from "../../../components/ui";
import {
  garmentCount,
  pickupStatuses,
  type Order,
} from "../../../domain/models";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
import {
  RouteMetadata,
  routeStyles,
} from "../../../components/DriverRoutePresentation";
import { tactile } from "../../../design-system/interaction";
import {
  openGoogleMapsDirections,
  openWazeDirections,
  resolveOrderNavigationTarget,
} from "../../../services/navigation/externalMaps";
import { DriverAction } from "./DriverAction";

export function NextServiceCard({ order: next }: { order: Order }) {
  const navigation = useLaundryNavigation();
  const isPickup = pickupStatuses.includes(next.status);
  const address = isPickup ? next.pickup.addressFull : next.delivery.addressFull;
  const timeSlot = isPickup ? next.pickup.timeSlot : next.delivery.timeSlot;
  const count = garmentCount(next);
  const navTarget = resolveOrderNavigationTarget(next);

  return (
    <Card style={routeStyles.next}>
      <View style={styles.priorityBar}>
        <View
          style={[
            styles.stopKindBadge,
            isPickup ? styles.pickupBadge : styles.deliveryBadge,
          ]}
        >
          <Icon
            name={isPickup ? "cube-outline" : "checkmark-done-circle-outline"}
            size={14}
            color={isPickup ? "#92400E" : "#166534"}
          />
          <Text
            style={[
              styles.stopKindText,
              { color: isPickup ? "#92400E" : "#166534" },
            ]}
          >
            {isPickup ? "RECOGIDA PRIORITARIA" : "ENTREGA PROGRAMADA"}
          </Text>
        </View>
        <View style={styles.priorityPill}>
          <Icon name="flash" size={12} color="#1D4ED8" />
          <Text style={styles.priorityPillText}>PARADA #1</Text>
        </View>
      </View>

      <View style={routeStyles.nextHeader}>
        <Title style={routeStyles.id}>{next.id}</Title>
        <StatusChip status={next.status} />
      </View>

      <View style={styles.customerRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Title style={routeStyles.customer}>{next.customerName}</Title>
          <Text style={styles.garmentSummary}>
            {next.pricingModel === "PER_WEIGHT"
              ? "Servicio por peso · Bolsa sellada"
              : `${count} prendas registradas`}
          </Text>
        </View>
        {next.customerPhone ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Llamar al cliente"
            onPress={() => {
              tactile("light");
              void Linking.openURL(`tel:${next.customerPhone}`).catch(() => {});
            }}
            style={({ pressed }) => [
              styles.quickIconBtn,
              { transform: [{ scale: pressed ? 0.94 : 1 }] },
            ]}
          >
            <Icon name="call-outline" size={18} color={contentColors.primary} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir con Google Maps"
          onPress={() => {
            tactile("light");
            void openGoogleMapsDirections(navTarget.latitude, navTarget.longitude);
          }}
          style={({ pressed }) => [
            styles.quickIconBtn,
            styles.quickNavBtn,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Icon name="navigate-outline" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <RouteMetadata icon="location-outline">
        <Body style={routeStyles.address}>{address}</Body>
      </RouteMetadata>

      <View style={routeStyles.time}>
        <RouteMetadata icon="time-outline">
          <Body muted style={routeStyles.address}>
            {timeSlot}
          </Body>
        </RouteMetadata>
      </View>

      <View style={styles.externalNavRow}>
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
          secondary
          icon="compass-outline"
          haptic="medium"
          style={styles.wazeBtn}
          textStyle={styles.wazeBtnText}
          onPress={() => {
            void openWazeDirections(navTarget.latitude, navTarget.longitude);
          }}
        />
      </View>

      <DriverAction order={next} />

      <Button
        label="Ver detalle del siguiente servicio"
        secondary
        icon="document-text-outline"
        style={routeStyles.secondary}
        textStyle={routeStyles.secondaryText}
        onPress={() =>
          navigation.navigate("DriverServiceDetail", { orderId: next.id })
        }
      />
      <Button
        label="Abrir chat con el cliente"
        secondary
        icon="chatbubble-ellipses-outline"
        style={routeStyles.secondary}
        textStyle={routeStyles.secondaryText}
        onPress={() => navigation.navigate("Chat", { orderId: next.id })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  priorityBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  stopKindBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pickupBadge: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },
  deliveryBadge: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  stopKindText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  priorityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  priorityPillText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    color: "#1D4ED8",
    letterSpacing: 0.3,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  garmentSummary: {
    fontSize: 12,
    lineHeight: 17,
    color: "#64748B",
    fontWeight: "600",
  },
  quickIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  quickNavBtn: {
    backgroundColor: contentColors.primary,
    borderColor: contentColors.primary,
  },
  externalNavRow: {
    gap: 8,
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
