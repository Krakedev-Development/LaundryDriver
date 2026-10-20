import { StatusChip } from "../../../components/presentation";
import { View } from "react-native";
import { Body, Button, Card, Title } from "../../../components/ui";
import { pickupStatuses, type Order } from "../../../domain/models";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
import {
  RouteMetadata,
  routeStyles,
} from "../../../components/DriverRoutePresentation";
import { DriverAction } from "./DriverAction";
export function NextServiceCard({ order: next }: { order: Order }) {
  const navigation = useLaundryNavigation();
  return (
    <Card style={routeStyles.next}>
      <View style={routeStyles.nextHeader}>
        <Title style={routeStyles.id}>{next.id}</Title>
        <StatusChip status={next.status} />
      </View>
      <Title style={routeStyles.customer}>{next.customerName}</Title>
      <RouteMetadata icon="location-outline">
        <Body style={routeStyles.address}>
          {pickupStatuses.includes(next.status)
            ? next.pickup.addressFull
            : next.delivery.addressFull}
        </Body>
      </RouteMetadata>
      <View style={routeStyles.time}>
        <RouteMetadata icon="time-outline">
          <Body muted style={routeStyles.address}>
            {pickupStatuses.includes(next.status)
              ? next.pickup.timeSlot
              : next.delivery.timeSlot}
          </Body>
        </RouteMetadata>
      </View>
      <DriverAction order={next} />
      <Button
        label="Ver detalle del siguiente servicio"
        secondary
        style={routeStyles.secondary}
        textStyle={routeStyles.secondaryText}
        onPress={() =>
          navigation.navigate("DriverServiceDetail", { orderId: next.id })
        }
      />
      <Button
        label="Abrir chat con el cliente"
        secondary
        style={routeStyles.secondary}
        textStyle={routeStyles.secondaryText}
        onPress={() => navigation.navigate("Chat", { orderId: next.id })}
      />
    </Card>
  );
}
