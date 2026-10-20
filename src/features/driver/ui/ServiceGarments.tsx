import { Accordion } from "../../../components/presentation";
import { Body, Card } from "../../../components/ui";
import { garmentCount, type Order } from "../../../domain/models";
import { driverServiceStyles } from "../../../components/DriverServicePresentation";
export function ServiceGarments({ order }: { order: Order }) {
  return (
    <Card style={driverServiceStyles.accordionCard}>
      <Accordion
        title={"Prendas esperadas (" + garmentCount(order) + ")"}
        appearance="list"
      >
        {order.items.map((i) => (
          <Body key={i.id} style={driverServiceStyles.text}>
            {i.quantity} × {i.garmentType} · {i.serviceType}
          </Body>
        ))}
        {order.pricingModel === "PER_WEIGHT" && (
          <Body>Servicio por peso. Confirma el conteo real al recoger.</Body>
        )}
      </Accordion>
    </Card>
  );
}
