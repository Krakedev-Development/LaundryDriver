export type Role = "CLIENT" | "DRIVER";
export type OperationalStatus =
  "AVAILABLE" | "ON_SERVICE" | "BREAK" | "OFFLINE";
export const operationalLabels: Record<OperationalStatus, string> = {
  AVAILABLE: "Disponible",
  ON_SERVICE: "En servicio",
  BREAK: "En pausa",
  OFFLINE: "Desconectado",
};
export interface Address {
  id: string;
  title: string;
  fullAddress: string;
  reference: string;
  isPrimary: boolean;
  latitude: number;
  longitude: number;
}
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  membershipTier: string;
}
export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  operationalStatus: OperationalStatus;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string;
  facilityName: string;
  zoneName: string;
  mustChangePassword: boolean;
  currentLat: number;
  currentLng: number;
  completedDeliveriesCount: number;
}
export interface Facility {
  id: string;
  name: string;
  address: string;
  openingHours: string;
  phone: string;
  acceptsDropoff: boolean;
  allowsPickup: boolean;
  latitude: number;
  longitude: number;
}
export interface Account {
  id: string;
  email: string;
  role: Role;
  passwordHash: string;
}
export interface Session {
  id: string;
  role: "DRIVER";
}
