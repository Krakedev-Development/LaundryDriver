import { View } from "react-native";
import { Page } from "../../components/Page";
import {
  ProfileDetail,
  ProfileHero,
  ProfileLogout,
  ProfileSection,
} from "../../components/ProfilePresentation";
import { Badge, Body, Icon, Title } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { operationalLabels } from "../../domain/models";
export function DriverProfileScreen() {
  const { state, execute } = useApp();
  const d = state.driver;
  return (
    <Page>
      <ProfileHero title={d.name} email={d.email}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="car-outline" size={18} />
          <Badge>{operationalLabels[d.operationalStatus]}</Badge>
        </View>
      </ProfileHero>
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
        <View style={{ padding: 16, gap: 8 }}>
          <Title>{d.completedDeliveriesCount} entregas completadas</Title>
          <Body muted>
            Consulta los servicios finalizados en el historial de tu ruta.
          </Body>
        </View>
      </ProfileSection>
      <ProfileLogout onPress={() => execute((r) => r.logout())} />
    </Page>
  );
}
