import { StyleSheet, Text, View } from "react-native";
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
} from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { visibleOrders } from "../../domain/repository";
import {
  deliveryStatuses,
  operationalLabels,
  pickupStatuses,
} from "../../domain/models";

export function DriverProfileScreen() {
  const { state, execute } = useApp();
  const d = state.driver;
  const activeRouteCount = visibleOrders(state).filter(
    (order) =>
      pickupStatuses.includes(order.status) ||
      deliveryStatuses.includes(order.status),
  ).length;

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
