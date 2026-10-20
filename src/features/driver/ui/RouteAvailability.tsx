import { ListItem } from "../../../components/presentation";
import { BottomSheet } from "../../../components/overlay/OverlayPortal";
import { useState } from "react";
import { View } from "react-native";
import { Badge, Body, Card, Choice, Icon, Title } from "../../../components/ui";
import { useApp } from "../../../store/AppProvider";
import {
  operationalLabels,
  type OperationalStatus,
  type Order,
} from "../../../domain/models";
import { routeStyles } from "../../../components/DriverRoutePresentation";
export function RouteAvailability({ orders }: { orders: Order[] }) {
  const { state, execute } = useApp();
  const driver = state.driver;
  const [statusPanel, setStatusPanel] = useState(false);
  return (
    <Card style={routeStyles.summary}>
      <View style={routeStyles.summaryHeader}>
        <View style={routeStyles.summaryIcon}>
          <Icon name="navigate-outline" size={22} />
        </View>
        <View style={routeStyles.info}>
          <Title style={routeStyles.title}>Ruta del día</Title>
          <Badge>{operationalLabels[driver.operationalStatus]}</Badge>
        </View>
      </View>
      <Body style={routeStyles.caption}>
        {driver.zoneName} · {orders.length} paradas activas
      </Body>
      <ListItem
        title="Cambiar disponibilidad"
        subtitle={operationalLabels[driver.operationalStatus]}
        icon="toggle-outline"
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
                execute((r) => r.setDriverOperationalStatus(status));
                setStatusPanel(false);
              }}
            />
          ),
        )}
      </BottomSheet>
    </Card>
  );
}
