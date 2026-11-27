import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { useEffect } from "react";
import { useApp } from "../store/AppProvider";
import { colors } from "../components/ui";
import { useReducedMotion } from "../design-system/MotionProvider";
import { OverlayProvider } from "../components/overlay/OverlayProvider";
import { Stack } from "./RootStack";
import { BootstrapState } from "../components/BootstrapState";
import { driverScreens } from "./DriverScreens";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { PasswordScreen } from "../screens/auth/PasswordScreen";
import { LiveLocationProvider } from "../features/driver/model/LiveLocation";
import { driverSocketService } from "../services/realtime/driverSocketService";
import { registerForPushNotificationsAsync, subscribeNotificationResponses } from "../services/notifications/pushRegistration";
import type { RootRoutes } from "./routes";

export const navigationRef = createNavigationContainerRef<RootRoutes>();

function ForcedPasswordScreen() {
  return <PasswordScreen forced />;
}
export function AppNavigation() {
  const { state, ready, error, reset, retry } = useApp();
  const reduced = useReducedMotion();
  const session = state.session;
  const flow = !session
    ? "auth"
    : state.driver.mustChangePassword
      ? "password"
      : "driver";

  useEffect(() => {
    if (!ready || flow !== "driver") {
      if (!session) driverSocketService.disconnect();
      return;
    }

    void driverSocketService.connect();
    void registerForPushNotificationsAsync();

    return subscribeNotificationResponses((data) => {
      if (!navigationRef.isReady() || !data.orderId) return;
      if (data.type === "CHAT") {
        navigationRef.navigate("Chat", { orderId: data.orderId });
        return;
      }
      navigationRef.navigate("DriverServiceDetail", { orderId: data.orderId });
    });
  }, [ready, flow, session]);

  if (!ready)
    return <BootstrapState error={error} reset={reset} retry={retry} />;

  const initial =
    flow === "auth"
      ? "Login"
      : flow === "password"
        ? "DriverChangePassword"
        : "DriverTabs";
  return (
    <NavigationContainer
      ref={navigationRef}
      key={session?.id + "-" + flow}
    >
      {/* Con sesión de chofer se sigue y envía su ubicación real, en cualquier pantalla. */}
      <LiveLocationProvider enabled={flow === "driver"}>
        <OverlayProvider>
          <Stack.Navigator
            initialRouteName={initial}
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: reduced ? "none" : "fade",
            }}
          >
            {flow === "auth" ? (
              <Stack.Screen name="Login" component={LoginScreen} />
            ) : flow === "password" ? (
              <Stack.Screen
                name="DriverChangePassword"
                component={ForcedPasswordScreen}
              />
            ) : (
              driverScreens()
            )}
          </Stack.Navigator>
        </OverlayProvider>
      </LiveLocationProvider>
    </NavigationContainer>
  );
}
