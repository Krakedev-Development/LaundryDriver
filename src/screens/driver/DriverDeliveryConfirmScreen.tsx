import { Page } from "../../components/Page";
import { Badge, Button, Card, Check, Empty } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { visibleOrders } from "../../domain/repository";
import type { ScreenProps } from "../../navigation/routes";
import { DeliveryRecipientFields } from "../../features/driver/ui/DeliveryRecipientFields";
import { DeliveryEvidenceFields } from "../../features/driver/ui/DeliveryEvidenceFields";
import { useDeliveryConfirmation } from "../../features/driver/model/useDeliveryConfirmation";
export function DriverDeliveryConfirmScreen({
  route,
}: ScreenProps<"DriverDeliveryConfirm">) {
  const { state } = useApp();
  const order = visibleOrders(state).find(
    (order) => order.id === route.params.orderId,
  );
  const form = useDeliveryConfirmation(order);
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
            label="Confirmar entrega"
            disabled={!form.checked || !form.name.trim()}
            onPress={form.confirm}
          />
        </>
      }
    >
      <Badge>{order.id}</Badge>
      <Card>
        <DeliveryRecipientFields
          name={form.name}
          setName={form.setName}
          relationship={form.relationship}
          setRelationship={form.setRelationship}
        />
        <DeliveryEvidenceFields
          notes={form.notes}
          setNotes={form.setNotes}
          photo={form.photo}
          setPhoto={form.setPhoto}
          code={form.code}
          setCode={form.setCode}
        />
        <Check
          label="Confirmo la entrega completa a la persona indicada"
          checked={form.checked}
          onChange={form.setChecked}
        />
        {form.feedback}
      </Card>
    </Page>
  );
}
