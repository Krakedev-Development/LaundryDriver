import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { contentTheme as theme } from "../../design-system/classic";
import { Card } from "../ui";

export function ProfileStats({
  items,
}: {
  items: readonly { label: string; text: string | number }[];
}) {
  return (
    <Card style={styles.card}>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 && <View style={styles.divider} />}
          <View style={styles.stat}>
            <Text style={styles.value}>{item.text}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        </Fragment>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 0,
    borderRadius: theme.radius.lg,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 8,
  },
  divider: {
    width: 1,
    height: 42,
    backgroundColor: theme.colors.border,
  },
  value: {
    maxWidth: "100%",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center",
  },
  label: {
    maxWidth: "100%",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    color: theme.colors.muted,
    textAlign: "center",
  },
});
