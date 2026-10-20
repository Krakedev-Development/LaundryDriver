import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { MainTabBar } from "../components/NavigationBar";
import { colors } from "../components/ui";
import { DriverProfileScreen } from "../screens/driver/DriverProfileScreen";
import {
  DriverHistoryScreen,
  DriverRouteScreen,
  DriverServicesScreen,
} from "../screens/DriverScreens";
import type { DriverTabRoutes } from "./routes";
const DriverTabs = createBottomTabNavigator<DriverTabRoutes>();
const options = {
  headerShown: false,
  animation: "none" as const,
  sceneStyle: { backgroundColor: colors.background },
};
function DriverBar(props: BottomTabBarProps) {
  return <MainTabBar {...props} />;
}
export function DriverMainTabs() {
  return (
    <DriverTabs.Navigator
      initialRouteName="DriverRoute"
      backBehavior="firstRoute"
      screenOptions={options}
      tabBar={DriverBar}
    >
      <DriverTabs.Screen name="DriverRoute" component={DriverRouteScreen} />
      <DriverTabs.Screen
        name="DriverServices"
        component={DriverServicesScreen}
      />
      <DriverTabs.Screen name="DriverHistory" component={DriverHistoryScreen} />
      <DriverTabs.Screen name="DriverProfile" component={DriverProfileScreen} />
    </DriverTabs.Navigator>
  );
}
