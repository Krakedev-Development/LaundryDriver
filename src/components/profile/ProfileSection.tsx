import React from "react";
import { StyleSheet, View } from "react-native";
import { contentTheme as theme } from "../../design-system/classic";
import { Card, Title } from "../ui";

export function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Title style={styles.sectionTitle}>{title}</Title>
      <Card style={styles.sectionCard}>{children}</Card>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    padding: 0,
    gap: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
});
