import type { IconName } from "../components/ui";
import type { PrimaryRoute, Routes } from "./routes";

export type Tab = {
  route: PrimaryRoute;
  label: string;
  icon: IconName;
};
export const driverTabs: Tab[] = [
  { route: "DriverRoute", label: "Mi ruta", icon: "navigate-outline" },
  { route: "DriverServices", label: "Servicios", icon: "list-outline" },
  { route: "DriverHistory", label: "Historial", icon: "time-outline" },
  { route: "DriverProfile", label: "Perfil", icon: "person-outline" },
];
export function primaryTabTarget(name: keyof Routes) {
  if (driverTabs.some((tab) => tab.route === name))
    return { name: "DriverTabs", screen: name } as const;
  return undefined;
}
