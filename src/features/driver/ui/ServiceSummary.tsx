import { StatusChip } from "../../../components/presentation";
import { View } from "react-native";
import { Body, Button, Card, Title } from "../../../components/ui";
import { type Order } from "../../../domain/models";
import { useLaundryNavigation } from "../../../navigation/useLaundryNavigation";
import {
  DriverServiceMeta,
  driverServiceStyles,
} from "../../../components/DriverServicePresentation";
export function ServiceSummary({
  order,
  pickup,
}: {
  order: Order;
  pickup: boolean;
}) {
  const navigation = useLaundryNavigation();
  return (
    <Card style={driverServiceStyles.card}>
      <View style={driverServiceStyles.heroRow}>
        <Title style={driverServiceStyles.id}>
          {order.id} · {pickup ? "Recogida" : "Entrega"}
        </Title>
        <StatusChip status={order.status} />
      </View>
      <DriverServiceMeta icon="person-outline">
        <Body style={driverServiceStyles.customer}>{order.customerName}</Body>
      </DriverServiceMeta>
      <Button
        label="Abrir chat con el cliente"
        icon="chatbubble-outline"
        secondary
        style={driverServiceStyles.secondary}
        onPress={() => navigation.navigate("Chat", { orderId: order.id })}
      />
    </Card>
  );
}
