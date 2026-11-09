import { StyleSheet, Text, View } from "react-native";
import { Page } from "../../components/Page";
import {
  Badge,
  Button,
  Card,
  Check,
  Empty,
  Icon,
} from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { visibleOrders } from "../../domain/repository";
import type { ScreenProps } from "../../navigation/routes";
import { driverServiceStyles } from "../../components/DriverServicePresentation";
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
            icon="checkmark-done-circle-outline"
            haptic="medium"
            style={driverServiceStyles.primary}
            disabled={!form.checked || !form.name.trim()}
            busy={form.busy}
            onPress={() => void form.confirm()}
          />
        </>
      }
    >
      <View style={styles.topHeader}>
        <Badge>{order.id}</Badge>
        <View style={styles.stepPill}>
          <Icon name="checkmark-done-outline" size={14} color="#166534" />
          <Text style={styles.stepPillText}>ENTREGA VERIFICADA</Text>
        </View>
      </View>
      <Card style={driverServiceStyles.card}>
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
          style={[
            driverServiceStyles.check,
            form.checked && driverServiceStyles.checked,
          ]}
          checked={form.checked}
          onChange={form.setChecked}
        />
        {form.feedback}
      </Card>
    </Page>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  stepPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  stepPillText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    color: "#166534",
    letterSpacing: 0.4,
  },
});
