import { modeFor, terminalStatuses, type AppState, type Leg } from "./models";

/** Preserve recorded custody while retiring customer drop-off from saved snapshots. */
export function migrateFulfillmentPolicy(state: AppState): AppState {
  for (const order of state.orders) {
    const plan = order.fulfillmentPlan;
    if (plan.inbound.method !== "CUSTOMER") continue;
    order.legacyInbound = JSON.parse(JSON.stringify(plan.inbound)) as Leg;
    const completed =
      plan.inbound.status === "COMPLETED" ||
      order.handoffs.some(
        (h) => h.type === "CUSTOMER_TO_FACILITY" && h.status === "USED",
      );
    if (completed) {
      plan.inbound.status = "COMPLETED";
      order.legacyInbound!.status = "COMPLETED";
    }
    const closed = terminalStatuses.includes(order.status);
    order.handoffs.forEach((handoff) => {
      if (handoff.type === "CUSTOMER_TO_FACILITY" && handoff.status !== "USED")
        handoff.status = "REVOKED";
    });
    const slot = state.timeSlots.find((s) => s.id === plan.inbound.timeSlotId);
    if (slot && !completed)
      slot.reservedCount = Math.max(0, slot.reservedCount - 1);
    plan.inbound.method = "DRIVER";
    plan.mode = modeFor("DRIVER", plan.outbound.method);
    if (!completed && !closed) {
      const customer = state.customers.find((c) => c.id === order.customerId);
      const address =
        customer?.addresses.find((a) => a.isPrimary) ?? customer?.addresses[0];
      plan.inbound = {
        method: "DRIVER",
        status: "PENDING",
        scheduledDate: "",
        timeSlotText: "",
        addressId: address?.id,
        addressFull: address?.fullAddress ?? "",
        latitude: address?.latitude ?? 0,
        longitude: address?.longitude ?? 0,
      };
      Object.assign(order.pickup, {
        addressId: address?.id ?? "",
        addressTitle: "Domicilio",
        addressFull: address?.fullAddress ?? "",
        date: "",
        timeSlot: "",
      });
      order.status = "PICKUP_PENDING";
      order.pickupNeedsScheduling = true;
      delete order.assignedDriverId;
    }
  }
  state.timeSlots = state.timeSlots.filter(
    (slot) => slot.context !== "FACILITY_DROPOFF",
  );
  return state;
}
