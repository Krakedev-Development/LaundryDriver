import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, type IconName } from "./ui";

/** Orders list presentation from 4fa1bd3, using the current order information. */
export function OrderMetadata({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <View style={ordersStyles.metadata}>
      <Icon name={icon} size={13} color="#9CA3AF" />
      <View style={ordersStyles.metadataText}>{children}</View>
    </View>
  );
}

export const ordersStyles = StyleSheet.create({
  screenTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: "#111827",
  },
  filter: {
    borderRadius: 12,
    borderColor: "#D6DFEA",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
  },
  filterText: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerStatus: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  id: { fontSize: 13, lineHeight: 19, fontWeight: "700", color: "#6B7280" },
  metadata: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  metadataText: { flex: 1, minWidth: 0 },
  mode: { fontSize: 16, lineHeight: 22, fontWeight: "700", color: "#111827" },
  service: { fontSize: 13, lineHeight: 19, color: "#374151" },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  time: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "flex-start",
    gap: 4,
    flexShrink: 1,
  },
  caption: { fontSize: 12, lineHeight: 18, color: "#6B7280", flexShrink: 1 },
  amount: { fontSize: 12, lineHeight: 18, fontWeight: "600", color: "#374151" },
  trackAction: { borderColor: "#E5E7EB", borderRadius: 10, minHeight: 48 },
  trackText: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
});
