import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Body,
  Check,
  Field,
  Icon,
  contentColors,
} from "../../../components/ui";
import { type Order } from "../../../domain/models";
import {
  DriverSectionTitle,
  DriverServiceMeta,
  driverServiceStyles,
} from "../../../components/DriverServicePresentation";
import { tactile } from "../../../design-system/interaction";

export function PickupGarmentFields({
  order,
  count,
  setCount,
  checked,
  setChecked,
}: {
  order: Order;
  count: string;
  setCount(value: string): void;
  checked: boolean;
  setChecked(value: boolean): void;
}) {
  const numericCount = Number(count);
  const safeCount =
    Number.isFinite(numericCount) && numericCount >= 1
      ? Math.floor(numericCount)
      : 1;

  const adjustCount = (delta: number) => {
    const next = Math.max(1, safeCount + delta);
    tactile("light");
    setCount(String(next));
  };

  return (
    <>
      <DriverSectionTitle icon="shirt-outline">
        Recepción de prendas
      </DriverSectionTitle>
      <DriverServiceMeta icon="person-outline">
        <Body style={driverServiceStyles.text}>
          {order.customerName} · {order.pickup.addressFull}
        </Body>
      </DriverServiceMeta>

      <View style={styles.itemsList}>
        {order.items.map((i) => (
          <View key={i.id} style={styles.garmentRow}>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>{i.quantity}</Text>
            </View>
            <Body style={[driverServiceStyles.text, { flex: 1 }]}>
              {i.garmentType}
            </Body>
            <Text style={styles.serviceTag}>{i.serviceType}</Text>
          </View>
        ))}
      </View>

      <View style={styles.counterControlBox}>
        <View style={styles.stepperRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Disminuir cantidad de prendas"
            disabled={safeCount <= 1}
            onPress={() => adjustCount(-1)}
            style={({ pressed }) => [
              styles.stepBtn,
              safeCount <= 1 && styles.stepBtnDisabled,
              {
                transform: [
                  { scale: pressed && safeCount > 1 ? 0.92 : 1 },
                ],
              },
            ]}
          >
            <Icon
              name="remove"
              size={22}
              color={safeCount <= 1 ? "#94A3B8" : contentColors.primary}
            />
          </Pressable>

          <View style={styles.fieldWrap}>
            <Field
              label="Cantidad de prendas recibidas"
              labelStyle={driverServiceStyles.label}
              style={driverServiceStyles.count}
              validate={(value) =>
                !Number.isInteger(Number(value)) || Number(value) < 1
                  ? "Ingresa una cantidad entera mayor a cero."
                  : undefined
              }
              value={count}
              onChangeText={setCount}
              keyboardType="number-pad"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aumentar cantidad de prendas"
            onPress={() => adjustCount(1)}
            style={({ pressed }) => [
              styles.stepBtn,
              styles.stepBtnPlus,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Icon name="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <Check
        label="Verifiqué las prendas con el cliente"
        style={[
          driverServiceStyles.check,
          checked && driverServiceStyles.checked,
        ]}
        checked={checked}
        onChange={setChecked}
      />
    </>
  );
}

const styles = StyleSheet.create({
  itemsList: {
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  garmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  qtyBadge: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: contentColors.primary,
  },
  serviceTag: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    color: "#64748B",
  },
  counterControlBox: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  fieldWrap: {
    flex: 1,
  },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: contentColors.primary,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnPlus: {
    backgroundColor: contentColors.primary,
    borderColor: contentColors.primary,
  },
  stepBtnDisabled: {
    borderColor: "#CBD5E1",
    backgroundColor: "#F1F5F9",
  },
});
