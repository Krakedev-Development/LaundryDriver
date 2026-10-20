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
      <Icon name={icon} size={13} color="#9CA3AF" />
      <View style={routeStyles.info}>{children}</View>
    </View>
  );
}

export const routeStyles = StyleSheet.create({
  summary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 14, lineHeight: 20, fontWeight: "700", color: "#374151" },
  section: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#374151",
    marginTop: 6,
  },
  caption: { fontSize: 13, lineHeight: 19, color: "#6B7280" },
  next: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  nextHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  id: { fontSize: 13, lineHeight: 19, fontWeight: "700", color: "#6B7280" },
  customer: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#111827",
  },
  metadata: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  address: { fontSize: 12, lineHeight: 18, color: "#6B7280" },
  time: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 8,
    marginTop: 4,
  },
  secondary: {
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  secondaryText: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
  choice: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  selectedChoice: { borderColor: "#93C5FD", backgroundColor: "#EFF6FF" },
});
