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
      <Icon name={icon} size={14} color="#64748B" />
      <View style={ordersStyles.metadataText}>{children}</View>
    </View>
  );
}

export const ordersStyles = StyleSheet.create({
  screenTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "800",
    color: "#0F172A",
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
  id: { fontSize: 13, lineHeight: 19, fontWeight: "800", color: "#143F73" },
  metadata: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  metadataText: { flex: 1, minWidth: 0 },
  mode: { fontSize: 15, lineHeight: 21, fontWeight: "700", color: "#0F172A" },
  service: { fontSize: 13, lineHeight: 19, color: "#334155", fontWeight: "500" },
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
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
    flexShrink: 1,
  },
  amount: { fontSize: 13, lineHeight: 18, fontWeight: "800", color: "#0F172A" },
  trackAction: { borderColor: "#CBD5E1", borderRadius: 10, minHeight: 48 },
  trackText: { fontSize: 13, lineHeight: 19, fontWeight: "700" },
});
