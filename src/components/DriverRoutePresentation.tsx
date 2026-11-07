import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, type IconName } from "./ui";
import { contentTheme as theme } from "../design-system/classic";

/** Route card surfaces from 4fa1bd3, retaining the current driver actions. */
export function RouteMetadata({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <View style={routeStyles.metadata}>
      <Icon name={icon} size={14} color="#64748B" />
      <View style={routeStyles.info}>{children}</View>
    </View>
  );
}

export const routeStyles = StyleSheet.create({
  summary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: theme.colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 15, lineHeight: 21, fontWeight: "800", color: "#0F172A" },
  section: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 6,
  },
  caption: { fontSize: 13, lineHeight: 19, color: "#64748B" },
  next: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    shadowColor: "#143F73",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  nextHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  id: { fontSize: 14, lineHeight: 20, fontWeight: "800", color: "#143F73" },
  customer: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
    color: "#0F172A",
  },
  metadata: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  address: { fontSize: 13, lineHeight: 19, color: "#334155", fontWeight: "500" },
  time: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    marginTop: 2,
  },
  secondary: {
    borderWidth: 1.2,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  secondaryText: { fontSize: 13, lineHeight: 19, fontWeight: "700" },
  choice: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  selectedChoice: { borderColor: "#93C5FD", backgroundColor: "#EFF6FF" },
});
