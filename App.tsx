import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "./src/store/AppProvider";
import { MotionProvider } from "./src/design-system/MotionProvider";
import { AppNavigation } from "./src/navigation/AppNavigation";
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <MotionProvider>
        <AppProvider>
          <AppNavigation />
        </AppProvider>
      </MotionProvider>
    </SafeAreaProvider>
  );
}
