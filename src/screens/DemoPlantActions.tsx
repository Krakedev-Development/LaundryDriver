import { Accordion } from "../components/presentation";
import { useState } from "react";
import { Badge, Body, Button, Field, useAction } from "../components/ui";
import { useApp } from "../store/AppProvider";
import { type Order } from "../domain/models";
export function DemoPlantActions({ order }: { order: Order }) {
  const { execute } = useApp();
  const a = useAction();
  const [weight, setWeight] = useState("15");
  const labels: Partial<Record<Order["status"], string>> = {
    AT_FACILITY:
      order.pricingModel === "PER_WEIGHT"
        ? "Simular inicio de pesaje"
        : "Simular ingreso a lavado",
    WEIGHING: "Registrar peso certificado",
    IN_PROCESS: "Simular control de calidad",
    QUALITY_CONTROL: "Simular prendas listas",
    READY_FOR_DELIVERY: "Simular asignación de entrega",
    READY_FOR_PICKUP: "Simular retiro en sede",
  };
  if (
    !labels[order.status] ||
    (order.status === "WEIGHING" && order.pricingStatus === "CALCULATED")
  )
    return null;
  return (
    <Accordion title="Herramientas de planta · Demo">
      <Badge>Simulación del prototipo</Badge>
      <Body muted>
        Avanza la operación de planta local para recorrer el flujo completo.
      </Body>
      {order.status === "WEIGHING" && (
        <Field
          label="Peso certificado en libras"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
      )}
      {a.feedback}
      <Button
        label={`${labels[order.status]} · Demo`}
        secondary
        onPress={() =>
          a.run(() =>
            execute((r) => r.advancePlantOperation(order.id, Number(weight))),
          )
        }
      />
    </Accordion>
  );
}
