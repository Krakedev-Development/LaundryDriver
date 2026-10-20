import { type AppState, type Order, type TimeSlot } from "./models";
export function visibleOrders(s: AppState): Order[] {
  if (!s.session || s.session.role !== "DRIVER") return [];
  return s.orders.filter((o) => o.assignedDriverId === s.session!.id);
}
export function slotRange(slot: TimeSlot): string {
  return `${slot.startTime} - ${slot.endTime}`;
}
