import { DriverMainTabs } from "../navigation/MainTabs";
import { ChatScreen } from "../screens/ChatScreen";
import { DriverMapScreen } from "../screens/DriverMapScreen";
import {
  DriverDeliveryConfirmScreen,
  DriverPickupConfirmScreen,
  DriverServiceDetailScreen,
} from "../screens/DriverScreens";
import { Stack } from "./RootStack";
export function driverScreens() {
  return (
    <>
      <Stack.Screen name="DriverTabs" component={DriverMainTabs} />
      <Stack.Screen
        name="DriverServiceDetail"
        component={DriverServiceDetailScreen}
        getId={({ params }) => params.orderId}
      />
      <Stack.Screen name="DriverMap" component={DriverMapScreen} />
      <Stack.Screen
        name="DriverPickupConfirm"
        component={DriverPickupConfirmScreen}
      />
      <Stack.Screen
        name="DriverDeliveryConfirm"
        component={DriverDeliveryConfirmScreen}
      />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </>
  );
}
