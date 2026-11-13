import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Page } from "../../components/Page";
import {
  ProfileDetail,
  ProfileHero,
  ProfileLogout,
  ProfileSection,
  ProfileStats,
} from "../../components/ProfilePresentation";
import {
  Badge,
  Body,
  Icon,
  Title,
  contentColors,
  type IconName,
} from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { visibleOrders } from "../../domain/repository";
import {
  deliveryStatuses,
  operationalLabels,
  pickupStatuses,
  type OperationalStatus,
} from "../../domain/models";
import {
  driverOrdersService,
  GUAYAQUIL_COORDINATES,
} from "../../services/orders/driverOrdersService";
import { tactile } from "../../design-system/interaction";

const ALL_OPERATIONAL_STATUSES: OperationalStatus[] = [
  "AVAILABLE",
  "ON_SERVICE",
  "BREAK",
  "OFFLINE",
];

const statusMeta: Record<
  OperationalStatus,
  {
    label: string;
    description: string;
    icon: IconName;
    bg: string;
    border: string;
    ink: string;
    dot: string;
  }
> = {
  AVAILABLE: {
    label: "Disponible",
    description: "Listo para recibir pedidos y avanzar en la ruta",
    icon: "checkmark-circle",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    ink: "#065F46",
    dot: "#10B981",
  },
  ON_SERVICE: {
    label: "En servicio",
    description: "En ruta activa de recogida o entrega",
    icon: "navigate-circle",
    bg: "#EFF6FF",
    border: "#93C5FD",
    ink: "#1E40AF",
    dot: "#2563EB",
  },
  BREAK: {
    label: "En pausa",
    description: "Pausa temporal de almuerzo o descanso",
    icon: "pause-circle",
    bg: "#FFFBEB",
    border: "#FCD34D",
    ink: "#92400E",
    dot: "#F59E0B",
  },
  OFFLINE: {
    label: "Desconectado",
    description: "Fuera de turno operativo",
    icon: "power",
    bg: "#F1F5F9",
    border: "#CBD5E1",
    ink: "#475569",
    dot: "#64748B",
  },
};

export function DriverProfileScreen() {
  const { state, execute } = useApp();
  const d = state.driver;
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeRouteCount = visibleOrders(state).filter(
    (order) =>
      pickupStatuses.includes(order.status) ||
      deliveryStatuses.includes(order.status),
  ).length;

  const handleUpdateStatus = async (status: OperationalStatus) => {
    if (d.operationalStatus === status || updating) return;
    tactile("medium");
    execute((r) => r.setDriverOperationalStatus(status));
    setUpdating(true);
    setFeedback(null);
    try {
      await driverOrdersService.updateLocation({
        latitude: d.currentLat || GUAYAQUIL_COORDINATES.center.latitude,
        longitude: d.currentLng || GUAYAQUIL_COORDINATES.center.longitude,
        status,
      });
      setFeedback(`Estado sincronizado: ${operationalLabels[status]}`);
    } catch {
      // Offline fallback
      setFeedback(`Estado local: ${operationalLabels[status]}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Page>
      <ProfileHero title={d.name} email={d.email}>
        <View style={styles.heroBadgeRow}>
          <Icon name="car-outline" size={18} />
          <Badge>{operationalLabels[d.operationalStatus]}</Badge>
          <View style={styles.plateChip}>
            <Text style={styles.plateChipText}>{d.vehiclePlate}</Text>
          </View>
        </View>
      </ProfileHero>

      <ProfileStats
        items={[
          { label: "Entregas hoy", text: d.completedDeliveriesCount },
          { label: "En ruta", text: activeRouteCount },
          { label: "Unidad", text: d.vehiclePlate },
        ]}
      />

      <ProfileSection title="Estado operativo en campo">
        <View style={styles.statusGrid}>
          {ALL_OPERATIONAL_STATUSES.map((status) => {
            const active = d.operationalStatus === status;
            const meta = statusMeta[status];
            return (
              <Pressable
                key={status}
                accessibilityRole="button"
                accessibilityLabel={`Cambiar estado a ${meta.label}`}
                accessibilityState={{ selected: active }}
                disabled={updating}
                onPress={() => void handleUpdateStatus(status)}
                style={({ pressed }) => [
                  styles.statusCard,
                  active && {
                    backgroundColor: meta.bg,
                    borderColor: meta.border,
                    borderWidth: 2,
                  },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={styles.statusHeader}>
                  <View style={styles.statusHeaderLeft}>
                    <View
                      style={[styles.statusDot, { backgroundColor: meta.dot }]}
                    />
                    <Text
                      style={[
                        styles.statusTitle,
                        active && { color: meta.ink, fontWeight: "800" },
                      ]}
                    >
                      {meta.label}
                    </Text>
                  </View>
                  {active && (
                    <View
                      style={[styles.activePill, { backgroundColor: meta.border }]}
                    >
                      <Text
                        style={[styles.activePillText, { color: meta.ink }]}
                      >
                        ACTIVO
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.statusDesc}>{meta.description}</Text>
              </Pressable>
            );
          })}
        </View>
        {feedback && (
          <View style={styles.feedbackContainer}>
            <Icon name="information-circle-outline" size={14} color={contentColors.primary} />
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}
      </ProfileSection>

      <ProfileSection title="Vehículo asignado">
        <ProfileDetail label="Vehículo" icon="car-outline">
          {d.vehicleModel} · {d.vehicleColor}
        </ProfileDetail>
        <ProfileDetail label="Placa" icon="pricetag-outline">
          {d.vehiclePlate}
        </ProfileDetail>
        <ProfileDetail label="Sede" icon="business-outline">
          {d.facilityName}
        </ProfileDetail>
        <ProfileDetail label="Zona" icon="location-outline" last>
          {d.zoneName}
        </ProfileDetail>
      </ProfileSection>

      <ProfileSection title="Historial de ruta">
        <View style={styles.summaryBox}>
          <View style={styles.summaryIconWrap}>
            <Icon
              name="trophy-outline"
              size={22}
              color={contentColors.primary}
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Title>{d.completedDeliveriesCount} entregas completadas</Title>
            <Body muted>
              Consulta los servicios finalizados en el historial de tu ruta.
            </Body>
          </View>
        </View>
      </ProfileSection>

      <ProfileLogout onPress={() => execute((r) => r.logout())} />
    </Page>
  );
}

const styles = StyleSheet.create({
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 2,
  },
  plateChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
  },
  plateChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: 0.8,
  },
  statusGrid: {
    gap: 8,
  },
  statusCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 4,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748B",
    paddingLeft: 16,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  feedbackContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  feedbackText: {
    fontSize: 12,
    lineHeight: 16,
    color: contentColors.primary,
    fontWeight: "600",
  },
  summaryBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: contentColors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
});
