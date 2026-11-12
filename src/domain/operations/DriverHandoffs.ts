import {
  handoffLabels,
  type Handoff,
  type HandoffType,
  type Order,
} from "../models";
import { DriverEvents } from "./DriverEvents";
function buildHandoff(
  orderId: string,
  type: HandoffType,
  fallbackCode: string,
  status: Handoff["status"],
): Handoff {
  return {
    id: `h-${orderId}-${type}`,
    orderId,
    type,
    status,
    qrToken: `QR-${orderId}-${type}`,
    fallbackCode,
    title: handoffLabels[type],
    description:
      "Presenta este código únicamente al realizar la transferencia de tus prendas.",
    createdAt: "Hoy 14:15",
  };
}
export class DriverHandoffs extends DriverEvents {
  protected addHandoff(o: Order, type: HandoffType, pending = false): void {
    if (type === "CUSTOMER_TO_FACILITY")
      throw Error("El ingreso del cliente en sede ya no está disponible.");
    if (
      o.handoffs.some(
        (h) => h.type === type && ["ACTIVE", "PENDING"].includes(h.status),
      )
    )
      return;
    const code = String(100000 + Math.floor(Math.random() * 900000));
    const h = buildHandoff(o.id, type, code, pending ? "PENDING" : "ACTIVE");
    h.id = this.id("h");
    h.qrToken = this.id(`QR-${o.id}`);
    h.createdAt = this.stamp();
    o.handoffs.push(h);
  }
  protected consume(o: Order, type: HandoffType, code?: string): void {
    if (type === "CUSTOMER_TO_FACILITY")
      throw Error("El ingreso del cliente en sede ya no está disponible.");
    let h = o.handoffs.find((h) => h.type === type && h.status === "ACTIVE");
    if (!h) {
      this.addHandoff(o, type);
      h = o.handoffs.find((h) => h.type === type && h.status === "ACTIVE")!;
    }
    if (code && code !== h.fallbackCode && code !== h.qrToken)
      throw Error("El código no corresponde a esta transferencia.");
    h.status = "USED";
    h.usedAt = this.stamp();
  }
}
