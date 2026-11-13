import { ListItem } from "../../../components/presentation";
import { BottomSheet } from "../../../components/overlay/OverlayPortal";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Body,
  Card,
  Choice,
  Icon,
  Title,
  type IconName,
} from "../../../components/ui";
import { useApp } from "../../../store/AppProvider";
import {
  operationalLabels,
  type OperationalStatus,
  type Order,
} from "../../../domain/models";
import { routeStyles } from "../../../components/DriverRoutePresentation";
import { tactile } from "../../../design-system/interaction";
import {
  driverOrdersService,
  GUAYAQUIL_COORDINATES,
} from "../../../services/orders/driverOrdersService";

const statusTheme: Record<
  OperationalStatus,
  {
    bg: string;
    border: string;
    ink: string;
    dot: string;
    icon: IconName;
  }
> = {
  AVAILABLE: {
    bg: "#ECFDF5",
    border: "#6EE7B7",
    ink: "#065F46",
    dot: "#10B981",
    icon: "checkmark-circle",
  },
  ON_SERVICE: {
    bg: "#EFF6FF",
    border: "#93C5FD",
    ink: "#1E40AF",
    dot: "#2563EB",
    icon: "navigate-circle",
  },
  BREAK: {
    bg: "#FFFBEB",
    border: "#FCD34D",
    ink: "#92400E",
    dot: "#F59E0B",
    icon: "pause-circle",
  },
  OFFLINE: {
    bg: "#F1F5F9",
    border: "#CBD5E1",
    ink: "#475569",
    dot: "#64748B",
    icon: "power",
  },
};

const quickStatuses: OperationalStatus[] = ["AVAILABLE", "ON_SERVICE", "BREAK"];

export function RouteAvailability({ orders }: { orders: Order[] }) {
  const { state, execute } = useApp();
  const driver = state.driver;
  const [statusPanel, setStatusPanel] = useState(false);
  const currentMeta = statusTheme[driver.operationalStatus];

  const handleSelectStatus = (status: OperationalStatus) => {
    tactile("medium");
    execute((r) => r.setDriverOperationalStatus(status));
    void driverOrdersService
      .updateLocation({
        latitude: driver.currentLat || GUAYAQUIL_COORDINATES.center.latitude,
        longitude: driver.currentLng || GUAYAQUIL_COORDINATES.center.longitude,
        status,
      })
      .catch(() => {});
  };

  return (
    <Card
      style={[
        routeStyles.summary,
        { borderColor: currentMeta.border, backgroundColor: "#FFFFFF" },
      ]}
    >
      <View style={routeStyles.summaryHeader}>
        <View
          style={[
            routeStyles.summaryIcon,
            {
              backgroundColor: currentMeta.bg,
              borderColor: currentMeta.border,
              borderWidth: 1,
            },
          ]}
        >
          <Icon name={currentMeta.icon} size={24} color={currentMeta.ink} />
        </View>
        <View style={routeStyles.info}>
          <View style={styles.titleRow}>
            <Title style={routeStyles.title}>Ruta del día</Title>
            <View
              style={[
                styles.liveBadge,
                {
                  backgroundColor: currentMeta.bg,
                  borderColor: currentMeta.border,
                },
              ]}
            >
              <View
                style={[styles.liveDot, { backgroundColor: currentMeta.dot }]}
              />
              <Text style={[styles.liveBadgeText, { color: currentMeta.ink }]}>
                {operationalLabels[driver.operationalStatus]}
              </Text>
            </View>
          </View>
          <Body style={routeStyles.caption}>
            {driver.zoneName} · {orders.length} paradas activas
          </Body>
        </View>
      </View>

      {/* Direct Tactical Availability Switcher */}
      <View style={styles.switcherTrack}>
        {quickStatuses.map((status) => {
          const active = driver.operationalStatus === status;
          const meta = statusTheme[status];
          return (
            <Pressable
              key={status}
              accessibilityRole="button"
              accessibilityLabel={`Estado ${operationalLabels[status]}`}
              accessibilityState={{ selected: active }}
              onPress={() => handleSelectStatus(status)}
              style={({ pressed }) => [
                styles.segmentBtn,
                active && {
                  backgroundColor: meta.bg,
                  borderColor: meta.border,
                },
                {
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <View
                style={[
                  styles.segmentDot,
                  { backgroundColor: active ? meta.dot : "#CBD5E1" },
                ]}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.segmentText,
                  active && { color: meta.ink, fontWeight: "800" },
                ]}
              >
                {operationalLabels[status]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ListItem
        title="Cambiar disponibilidad"
        subtitle={operationalLabels[driver.operationalStatus]}
        icon="options-outline"
        onPress={() => setStatusPanel(true)}
      />
      <BottomSheet
        title="Disponibilidad"
        visible={statusPanel}
        onClose={() => setStatusPanel(false)}
      >
        {(Object.keys(operationalLabels) as OperationalStatus[]).map(
          (status) => (
            <Choice
              key={status}
              style={[
                routeStyles.choice,
                driver.operationalStatus === status &&
                  routeStyles.selectedChoice,
              ]}
              label={operationalLabels[status]}
              selected={driver.operationalStatus === status}
              onPress={() => {
                handleSelectStatus(status);
                setStatusPanel(false);
              }}
            />
          ),
        )}
      </BottomSheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveBadgeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
  },
  switcherTrack: {
    flexDirection: "row",
    gap: 6,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minHeight: 38,
    paddingHorizontal: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "transparent",
  },
  segmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  segmentText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    color: "#64748B",
  },
});
