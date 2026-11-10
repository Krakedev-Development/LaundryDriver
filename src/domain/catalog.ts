import type { Facility, MembershipPlan, Promo, TimeSlot } from "./models";

// El producto no trae sedes, promociones, planes ni cupos de ejemplo: todo llega del servidor.
export const facilities: Facility[] = [];
export const promos: Promo[] = [];
export const plans: MembershipPlan[] = [];
export const initialSlots: TimeSlot[] = [];
