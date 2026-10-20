import { type OrderStatus } from "../models";
import { DriverHandoffs } from "./DriverHandoffs";
export class PickupOperations extends DriverHandoffs {
  driverAction(
    orderId: string,
    action:
      | "START_PICKUP"
      | "ARRIVE_PICKUP"
      | "GO_FACILITY"
      | "ARRIVE_FACILITY"
      | "START_DELIVERY"
      | "ARRIVE_DELIVERY",
  ): void {
    const o = this.order(orderId, "DRIVER");
    const transitions: Record<typeof action, [OrderStatus, OrderStatus]> = {
      START_PICKUP: ["PICKUP_ASSIGNED", "HEADING_TO_PICKUP"],
      ARRIVE_PICKUP: ["HEADING_TO_PICKUP", "ARRIVED_FOR_PICKUP"],
      GO_FACILITY: ["PICKED_UP", "HEADING_TO_FACILITY"],
      ARRIVE_FACILITY: ["HEADING_TO_FACILITY", "AT_FACILITY"],
      START_DELIVERY: ["DELIVERY_ASSIGNED", "OUT_FOR_DELIVERY"],
      ARRIVE_DELIVERY: ["OUT_FOR_DELIVERY", "ARRIVED_FOR_DELIVERY"],
    };
    const [from, to] = transitions[action];
    if (o.status !== from)
      throw Error("La acción no corresponde al estado actual.");
    if (["BREAK", "OFFLINE"].includes(this.state.driver.operationalStatus))
      throw Error("Ponte disponible antes de continuar el servicio.");
    if (action === "START_PICKUP")
      o.fulfillmentPlan.inbound.status = "IN_PROGRESS";
    if (action === "START_DELIVERY") {
      if (o.paymentStatus !== "PAGADO")
        throw Error("El pedido requiere pago antes del despacho.");
      o.fulfillmentPlan.outbound.status = "IN_PROGRESS";
      o.canChangeOutboundMethod = false;
      o.handoffs
        .filter(
          (h) => h.type === "DRIVER_TO_CUSTOMER" && h.status === "PENDING",
        )
        .forEach((h) => {
          h.status = "ACTIVE";
        });
      this.addHandoff(o, "DRIVER_TO_CUSTOMER");
      this.addHandoff(o, "FACILITY_TO_DRIVER");
      this.consume(o, "FACILITY_TO_DRIVER");
    }
    if (action === "ARRIVE_FACILITY") {
      this.consume(o, "DRIVER_TO_FACILITY");
      o.fulfillmentPlan.inbound.status = "COMPLETED";
      o.fulfillmentPlan.inbound.completedAt = this.stamp();
      this.state.driver.operationalStatus = "AVAILABLE";
    } else this.state.driver.operationalStatus = "ON_SERVICE";
    this.event(o, to);
  }
  driverConfirmPickup(
    orderId: string,
    count: number,
    notes: string,
    photoUri?: string,
    code?: string,
  ): void {
    const o = this.order(orderId, "DRIVER");
    if (o.status !== "ARRIVED_FOR_PICKUP")
      throw Error("Marca la llegada antes de confirmar.");
    if (!Number.isSafeInteger(count) || count <= 0)
      throw Error("Ingresa un conteo de prendas válido.");
    this.consume(o, "CUSTOMER_TO_DRIVER", code);
    this.addHandoff(o, "DRIVER_TO_FACILITY");
    Object.assign(o.pickup, {
      garmentCountConfirmed: count,
      notes: notes.trim() || o.pickup.notes,
      pickedUpAt: this.stamp(),
      evidencePhotoUri: photoUri,
    });
    this.event(o, "PICKED_UP", `${count} prendas recibidas y verificadas.`);
  }
}
