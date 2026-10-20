import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, Title, type IconName } from "./ui";
import { contentTheme as theme } from "../design-system/classic";

/** Driver detail/pickup surfaces adapted from the driver order view in 4fa1bd3. */
export function DriverSectionTitle({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <View style={driverServiceStyles.titleRow}>
      <Icon name={icon} size={16} color={theme.colors.primary} />
      <Title style={driverServiceStyles.title}>{children}</Title>
    </View>
  );
}
export function DriverServiceMeta({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <View style={driverServiceStyles.meta}>
      <Icon name={icon} size={14} color="#9CA3AF" />
      <View style={driverServiceStyles.info}>{children}</View>
    </View>
  );
}
export const driverServiceStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  accordionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 0,
    gap: 0,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  heroRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  id: { fontSize: 18, lineHeight: 25, fontWeight: "700", color: "#111827" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#374151",
    flexShrink: 1,
  },
  customer: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#111827",
  },
  meta: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  info: { flex: 1, minWidth: 0 },
  text: { fontSize: 14, lineHeight: 21, color: "#6B7280" },
  garment: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 7,
  },
  label: { fontSize: 13, lineHeight: 19, fontWeight: "600", color: "#374151" },
  input: { borderRadius: 10, fontSize: 14, backgroundColor: "#FAFAFA" },
  count: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    color: "#111827",
  },
  check: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  checked: { borderColor: "#93C5FD", backgroundColor: "#EFF6FF" },
  notice: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
  },
  primary: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    padding: 14,
  },
});
