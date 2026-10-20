import { today } from "../state";
import { plans, promos } from "../catalog";
import { round } from "../models";
import { DeliveryOperations } from "./DeliveryOperations";
export class PlantOperations extends DeliveryOperations {
  advancePlantOperation(orderId: string, measuredLb?: number): void {
    const o = this.order(orderId);
    this.active(o);
    switch (o.status) {
      case "AT_FACILITY":
        this.event(
          o,
          o.pricingModel === "PER_WEIGHT" ? "WEIGHING" : "IN_PROCESS",
        );
        break;
      case "WEIGHING": {
        if (o.pricingStatus === "CALCULATED")
          throw Error("Confirma el peso y paga desde el cliente.");
        if (!measuredLb || !Number.isFinite(measuredLb) || measuredLb <= 0)
          throw Error("Ingresa el peso certificado en libras.");
        o.weightLb = measuredLb;
        o.weightKg = round(measuredLb * 0.45359237);
        o.pricing.itemsSubtotal = round(measuredLb * o.pricePerLb);
        const c = this.state.customers.find((c) => c.id === o.customerId)!;
        o.pricing.membershipBenefitDiscount = round(
          (o.pricing.itemsSubtotal *
            (plans.find((p) => p.name === c.membershipTier)
              ?.garmentDiscountPercent ?? 0)) /
            100,
        );
        const p = promos.find(
          (p) =>
            p.code === o.promotionCode &&
            p.validUntil >= today(this.now) &&
            o.pricing.itemsSubtotal >= p.minOrderAmount,
        );
        o.pricing.discount = p
          ? round(
              p.discountPercent
                ? (o.pricing.itemsSubtotal * p.discountPercent) / 100
                : p.fixedDiscount,
            )
          : 0;
        o.pricing.total = round(
          Math.max(
            0,
            o.pricing.itemsSubtotal +
              o.pricing.extrasTotal -
              o.pricing.discount -
              o.pricing.membershipBenefitDiscount,
          ),
        );
        o.pricingStatus = "CALCULATED";
        o.paymentStatus = "PENDIENTE";
        this.notify(
          o,
          "Peso certificado",
          "Revisa el peso final y confirma el pago.",
        );
        break;
      }
      case "IN_PROCESS":
        this.event(o, "QUALITY_CONTROL");
        break;
      case "QUALITY_CONTROL": {
        const customer = o.fulfillmentPlan.outbound.method === "CUSTOMER";
        this.event(o, customer ? "READY_FOR_PICKUP" : "READY_FOR_DELIVERY");
        this.addHandoff(
          o,
          customer ? "FACILITY_TO_CUSTOMER" : "DRIVER_TO_CUSTOMER",
          !customer,
        );
        break;
      }
      case "READY_FOR_DELIVERY":
        o.assignedDriverId = this.state.driver.id;
        this.event(o, "DELIVERY_ASSIGNED");
        break;
      case "READY_FOR_PICKUP":
        this.consume(o, "FACILITY_TO_CUSTOMER");
        o.fulfillmentPlan.outbound.status = "COMPLETED";
        o.fulfillmentPlan.outbound.completedAt = this.stamp();
        this.event(o, "COMPLETED");
        break;
      default:
        throw Error(
          "No hay una operación de planta disponible en este estado.",
        );
    }
  }
}
