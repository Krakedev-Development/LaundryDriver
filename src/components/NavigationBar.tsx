import { theme } from "../design-system/tokens";
import { tactile } from "../design-system/interaction";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { driverTabs, type Tab } from "../navigation/primaryTabs";
import { colors, Icon, type IconName } from "./ui";
const selectedIcons: Partial<Record<Tab["route"], IconName>> = {
  DriverRoute: "navigate",
  DriverServices: "list",
  DriverHistory: "time",
  DriverProfile: "person",
};
export function NavigationBar({
  tabs,
  activeRoute,
  onSelect,
}: {
  tabs: Tab[];
  activeRoute: string;
  onSelect(route: Tab["route"]): void;
}) {
  return (
    <View accessibilityRole="tablist" style={styles.bar}>
      {tabs.map((tab) => {
        const selected = activeRoute === tab.route;

        const ink = selected ? colors.primary : "#64748B";
        return (
          <Pressable
            key={tab.route}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            aria-selected={selected}
            onPress={() => {
              tactile("selection");
              onSelect(tab.route);
            }}
            style={({ pressed }) => [
              styles.tab,
              { opacity: pressed ? theme.opacity.pressed : 1 },
            ]}
          >
            {
              <>
                <View style={styles.iconSlot}>
                  <Icon
                    name={
                      selected
                        ? (selectedIcons[tab.route] ?? tab.icon)
                        : tab.icon
                    }
                    size={16}
                    color={ink}
                  />
                </View>
                <Text
                  style={[
                    styles.label,
                    { fontWeight: selected ? "700" : "500", color: ink },
                  ]}
                >
                  {tab.label}
                </Text>
              </>
            }
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EEF1F4",
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 64,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconSlot: { height: 20, alignItems: "center", justifyContent: "center" },
  label: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  primaryAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -4 }],
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
});
export function MainTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ backgroundColor: colors.surface }}
    >
      <NavigationBar
        tabs={driverTabs}
        activeRoute={state.routes[state.index].name}
        onSelect={(name) => {
          const target = state.routes.find((route) => route.name === name);
          if (!target) return;
          const event = navigation.emit({
            type: "tabPress",
            target: target.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) navigation.navigate(name);
        }}
      />
    </SafeAreaView>
  );
}
