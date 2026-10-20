import { Pressable, StyleSheet, Text } from "react-native";
import { Icon } from "../ui";

export function ProfileLogout({ onPress }: { onPress(): void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
      onPress={onPress}
      style={({ pressed }) => [styles.logout, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Icon name="log-out-outline" size={18} color="#B91C1C" />
      <Text style={styles.logoutText}>Cerrar sesión</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    minHeight: 52,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#B91C1C",
  },
});
