import { StyleSheet, Text, View } from "react-native";
import { Accordion } from "../../../components/presentation";
import { Body, Card, contentColors } from "../../../components/ui";
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
          <View key={i.id} style={styles.itemRow}>
            <View style={styles.qtyPill}>
              <Text style={styles.qtyText}>{i.quantity}</Text>
            </View>
            <Body style={[driverServiceStyles.text, { flex: 1 }]}>
              {i.garmentType} · {i.serviceType}
            </Body>
          </View>
        ))}
        {order.pricingModel === "PER_WEIGHT" && (
          <Body>Servicio por peso. Confirma el conteo real al recoger.</Body>
        )}
      </Accordion>
    </Card>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  qtyPill: {
    minWidth: 26,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: contentColors.primary,
  },
});
