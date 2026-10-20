import { NavigationContainer } from "@react-navigation/native";
import { useApp } from "../store/AppProvider";
import { colors } from "../components/ui";
import { useReducedMotion } from "../design-system/MotionProvider";
import { OverlayProvider } from "../components/overlay/OverlayProvider";
import { Stack } from "./RootStack";
import { BootstrapState } from "../components/BootstrapState";
import { driverScreens } from "./DriverScreens";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { PasswordScreen } from "../screens/auth/PasswordScreen";
function ForcedPasswordScreen() {
  return <PasswordScreen forced />;
}
export function AppNavigation() {
  const { state, ready, error, reset, retry } = useApp();
  const reduced = useReducedMotion();
  if (!ready)
    return <BootstrapState error={error} reset={reset} retry={retry} />;
  const session = state.session;
  const flow = !session
    ? "auth"
    : state.driver.mustChangePassword
      ? "password"
      : "driver";
  const initial =
    flow === "auth"
      ? "Login"
      : flow === "password"
        ? "DriverChangePassword"
        : "DriverTabs";
  return (
    <NavigationContainer key={session?.id + "-" + flow}>
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
    </NavigationContainer>
  );
}
