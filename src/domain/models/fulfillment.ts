export type Method = "DRIVER" | "CUSTOMER";
export type Mode = "HOME_HOME" | "HOME_STORE";
export const modeLabels: Record<Mode, string> = {
  HOME_HOME: "Domicilio completo · recogida y entrega",
  HOME_STORE: "Pick up · recogida a domicilio y retiro en sede",
};
export type HandoffType =
  | "CUSTOMER_TO_DRIVER"
  | "CUSTOMER_TO_FACILITY"
  | "DRIVER_TO_FACILITY"
  | "FACILITY_TO_DRIVER"
  | "DRIVER_TO_CUSTOMER"
  | "FACILITY_TO_CUSTOMER";
export const handoffLabels: Record<HandoffType, string> = {
  CUSTOMER_TO_DRIVER: "Código de entrega al chofer",
  CUSTOMER_TO_FACILITY: "QR de entrega en sede",
  DRIVER_TO_FACILITY: "Ingreso a planta",
  FACILITY_TO_DRIVER: "Despacho desde planta",
  DRIVER_TO_CUSTOMER: "Código de entrega final",
  FACILITY_TO_CUSTOMER: "QR de retiro en sede",
};
export interface TimeSlot {
  id: string;
  context:
    | "DRIVER_PICKUP"
    | "DRIVER_DELIVERY"
    | "FACILITY_DROPOFF"
    | "FACILITY_PICKUP";
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  reservedCount: number;
  active: boolean;
}
export interface Leg {
  method: Method;
  facilityId?: string;
  facilityName?: string;
  addressId?: string;
  addressFull: string;
  scheduledDate: string;
  timeSlotId?: string;
  timeSlotText: string;
  status: string;
  completedAt?: string;
  latitude: number;
  longitude: number;
}
export interface FulfillmentPlan {
  mode: Mode;
  inbound: Leg;
  outbound: Leg;
}
export interface Handoff {
  id: string;
  orderId: string;
  type: HandoffType;
  status: "PENDING" | "ACTIVE" | "USED" | "EXPIRED" | "REVOKED";
  qrToken: string;
  fallbackCode: string;
  title: string;
  description: string;
  createdAt: string;
  usedAt?: string;
}
export function modeFor(inbound: Method, outbound: Method): Mode {
  if (inbound !== "DRIVER" || !["DRIVER", "CUSTOMER"].includes(outbound))
    throw Error(
      "La recogida debe ser a domicilio. Solo se admite domicilio completo o pick up.",
    );
  return outbound === "DRIVER" ? "HOME_HOME" : "HOME_STORE";
}
