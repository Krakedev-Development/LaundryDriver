import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Body, Icon, Title } from "./ui";
import { contentTheme as theme } from "../design-system/classic";

/** Password form surfaces from 4fa1bd3; current validation stays in the screen. */
export function PasswordHint({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={passwordStyles.hint}>
      <Icon
        name="shield-checkmark-outline"
        size={22}
        color={theme.colors.primary}
      />
      <View style={passwordStyles.hintContent}>
        <Title style={passwordStyles.hintTitle}>{title}</Title>
        <Body style={passwordStyles.hintText}>{children}</Body>
      </View>
    </View>
  );
}

export const passwordStyles = StyleSheet.create({
  hint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: theme.colors.soft,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  hintContent: { flex: 1, minWidth: 0, gap: 4 },
  hintTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  hintText: { fontSize: 13, lineHeight: 19, color: theme.colors.text },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: { fontSize: 12, lineHeight: 18, fontWeight: "700", color: "#64748B" },
  input: {
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    paddingLeft: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  requirement: { fontSize: 12, lineHeight: 18 },
  saveAction: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
  },
  saveText: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
});
