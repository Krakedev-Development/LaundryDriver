import type {
  NavigatorScreenParams,
  RouteProp,
} from "@react-navigation/native";
export type Routes = {
  Splash: undefined;
  Login: undefined;
  Chat: { orderId: string };
  DriverRoute: undefined;
  DriverServices: undefined;
  DriverHistory: undefined;
  DriverProfile: undefined;
  DriverServiceDetail: { orderId: string };
  DriverMap: { orderId: string };
  DriverPickupConfirm: { orderId: string };
  DriverDeliveryConfirm: { orderId: string };
  DriverChangePassword: undefined;
};
export type DriverTabRoutes = Pick<
  Routes,
  "DriverRoute" | "DriverServices" | "DriverHistory" | "DriverProfile"
>;
export type PrimaryRoute = keyof DriverTabRoutes;
export type RootRoutes = Omit<Routes, PrimaryRoute> & {
  DriverTabs: NavigatorScreenParams<DriverTabRoutes> | undefined;
};
export type ScreenProps<T extends keyof Routes> = {
  route: RouteProp<Routes, T>;
};
export const titles: Record<keyof Routes, string> = {
  Splash: "Laundry Clean & Fresh",
  Login: "Iniciar sesión",
  Chat: "Chat del pedido",
  DriverRoute: "Mi ruta",
  DriverServices: "Mis servicios",
  DriverHistory: "Historial",
  DriverProfile: "Mi cuenta",
  DriverServiceDetail: "Detalle de servicio",
  DriverMap: "Mapa y navegación",
  DriverPickupConfirm: "Confirmar recogida",
  DriverDeliveryConfirm: "Confirmar entrega",
  DriverChangePassword: "Cambiar contraseña",
};
