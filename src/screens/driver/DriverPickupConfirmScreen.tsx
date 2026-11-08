import { StyleSheet, Text, View } from "react-native";
import { Page } from "../../components/Page";
import {
  Badge,
  Body,
  Button,
  Card,
  Empty,
  Icon,
  Title,
  contentColors,
} from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { visibleOrders } from "../../domain/repository";
import type { ScreenProps } from "../../navigation/routes";
import { driverServiceStyles } from "../../components/DriverServicePresentation";
import { PickupGarmentFields } from "../../features/driver/ui/PickupGarmentFields";
import { PickupEvidenceFields } from "../../features/driver/ui/PickupEvidenceFields";
import { usePickupConfirmation } from "../../features/driver/model/usePickupConfirmation";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";

export function DriverPickupConfirmScreen({
  route,
}: ScreenProps<"DriverPickupConfirm">) {
  const navigation = useLaundryNavigation();
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

  const isCustodyHeld =
    form.pickedUpConfirmed ||
    ["PICKED_UP", "HEADING_TO_FACILITY"].includes(order.status);

  return (
    <Page
      footer={
        <>
          {isCustodyHeld ? (
            <View style={{ gap: 10 }}>
              <Button
                label="Confirmar llegada a planta"
                icon="business-outline"
                haptic="medium"
                busy={form.busy}
                style={driverServiceStyles.primary}
                onPress={() => void form.markFacilityArrival()}
              />
              <Button
                label="Volver a mi ruta"
                secondary
                icon="arrow-back-outline"
                onPress={() => navigation.popTo("DriverRoute")}
              />
            </View>
          ) : (
            <Button
              label="Confirmar recogida"
              icon="checkmark-circle-outline"
              haptic="medium"
              busy={form.busy}
              style={driverServiceStyles.primary}
              disabled={
                !form.checked ||
                !Number.isInteger(Number(form.count)) ||
                Number(form.count) < 1
              }
              onPress={() => void form.confirm()}
            />
          )}
        </>
      }
    >
      <View style={styles.topHeader}>
        <Badge>{order.id}</Badge>
        <View
          style={[
            styles.stepPill,
            isCustodyHeld && {
              backgroundColor: "#DCFCE7",
              borderColor: "#86EFAC",
            },
          ]}
        >
          <Icon
            name={isCustodyHeld ? "checkmark-done-outline" : "cube-outline"}
            size={14}
            color={isCustodyHeld ? "#166534" : "#92400E"}
          />
          <Text
            style={[
              styles.stepPillText,
              isCustodyHeld && { color: "#166534" },
            ]}
          >
            {isCustodyHeld
              ? "CUSTODIA TRANSFERIDA"
              : "CUSTODIA DE RECOGIDA"}
          </Text>
        </View>
      </View>

      {isCustodyHeld ? (
        <Card style={styles.custodySuccessCard}>
          <View style={styles.custodyIconWrap}>
            <Icon
              name="checkmark-done-circle"
              size={34}
              color="#166534"
            />
          </View>
          <Title style={styles.custodySuccessTitle}>
            Prendas recibidas en Guayaquil
          </Title>
          <Body muted style={styles.custodySuccessText}>
            La recolección fue registrada y verificada exitosamente. Continúa tu
            traslado hacia la planta central asignada para confirmar la llegada.
          </Body>
          <View style={styles.facilityInfoBox}>
            <Icon name="business-outline" size={16} color={contentColors.primary} />
            <Text style={styles.facilityInfoText}>
              Destino: {order.facilityName || "Planta Kennedy Norte"}
            </Text>
          </View>
          {form.feedback}
        </Card>
      ) : (
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
      )}
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
    backgroundColor: contentColors.warningSoft,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  stepPillText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    color: "#92400E",
    letterSpacing: 0.4,
  },
  custodySuccessCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  custodyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  custodySuccessTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: "#166534",
    textAlign: "center",
  },
  custodySuccessText: {
    textAlign: "center",
    lineHeight: 20,
  },
  facilityInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  facilityInfoText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
});
