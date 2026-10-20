import { Page } from "../../components/Page";
import { Badge, Button, Card, Empty } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { visibleOrders } from "../../domain/repository";
import type { ScreenProps } from "../../navigation/routes";
import { driverServiceStyles } from "../../components/DriverServicePresentation";
import { PickupGarmentFields } from "../../features/driver/ui/PickupGarmentFields";
import { PickupEvidenceFields } from "../../features/driver/ui/PickupEvidenceFields";
import { usePickupConfirmation } from "../../features/driver/model/usePickupConfirmation";
export function DriverPickupConfirmScreen({
  route,
}: ScreenProps<"DriverPickupConfirm">) {
  const { state } = useApp();
  const order = visibleOrders(state).find(
    (order) => order.id === route.params.orderId,
  );
  const form = usePickupConfirmation(order);
  if (!order)
    return (
      <Page>
        <Empty text="Servicio no disponible." />
      </Page>
    );
  return (
    <Page
      footer={
        <>
          <Button
            label="Confirmar recogida"
            icon="checkmark-circle-outline"
            style={driverServiceStyles.primary}
            disabled={
              !form.checked ||
              !Number.isInteger(Number(form.count)) ||
              Number(form.count) < 1
            }
            onPress={form.confirm}
          />
        </>
      }
    >
      <Badge>{order.id}</Badge>
      <Card style={driverServiceStyles.card}>
        <PickupGarmentFields
          order={order}
          count={form.count}
          setCount={form.setCount}
          checked={form.checked}
          setChecked={form.setChecked}
        />
        <PickupEvidenceFields
          notes={form.notes}
          setNotes={form.setNotes}
          photo={form.photo}
          setPhoto={form.setPhoto}
          code={form.code}
          setCode={form.setCode}
        />
        {form.feedback}
      </Card>
    </Page>
  );
}
