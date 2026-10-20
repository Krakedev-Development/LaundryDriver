import { Accordion } from "../../../components/presentation";
import { Badge, Body, Card } from "../../../components/ui";
import { type Order } from "../../../domain/models";
import { driverServiceStyles } from "../../../components/DriverServicePresentation";
export function ServiceReceipts({ order }: { order: Order }) {
  return (
    <>
      {order.pickup.garmentCountConfirmed !== undefined && (
        <Card style={driverServiceStyles.accordionCard}>
          <Accordion title="Constancia de recogida" appearance="list">
            <Body>
              {order.pickup.garmentCountConfirmed} prendas ·{" "}
              {order.pickup.pickedUpAt}
            </Body>
            <Body>{order.pickup.notes}</Body>
            {order.pickup.evidencePhotoUri && <Badge>Evidencia adjunta</Badge>}
          </Accordion>
        </Card>
      )}
      {order.delivery.recipientName && (
        <Card style={driverServiceStyles.accordionCard}>
          <Accordion title="Constancia de entrega" appearance="list">
            <Body>
              {order.delivery.recipientName} ·{" "}
              {order.delivery.recipientRelationship}
            </Body>
            <Body muted>{order.delivery.deliveredAt}</Body>
            <Body>{order.delivery.deliveryNotes}</Body>
            {order.delivery.evidencePhotoUri && (
              <Badge>Evidencia adjunta</Badge>
            )}
          </Accordion>
        </Card>
      )}
    </>
  );
}
