import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { contentTheme as theme } from "../../design-system/classic";
import { Body, Icon, type IconName } from "../ui";

export function ProfileDetail({
  label,
  children,
  icon,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  icon: IconName;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={[styles.detailIcon, { backgroundColor: theme.colors.soft }]}>
        <Icon name={icon} size={16} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Body style={styles.detailValue}>{children}</Body>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    minHeight: 64,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: theme.colors.muted,
  },
  detailValue: {
    flex: 1.3,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "right",
  },
});
