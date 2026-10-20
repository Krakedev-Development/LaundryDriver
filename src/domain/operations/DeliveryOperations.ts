import { PickupOperations } from "./PickupOperations";
export class DeliveryOperations extends PickupOperations {
  driverConfirmDelivery(
    orderId: string,
    name: string,
    relationship: string,
    notes: string,
    photoUri?: string,
    code?: string,
  ): void {
    const o = this.order(orderId, "DRIVER");
    if (o.status !== "ARRIVED_FOR_DELIVERY" || !name.trim())
      throw Error("Confirma llegada y nombre de quien recibe.");
    this.consume(o, "DRIVER_TO_CUSTOMER", code);
    Object.assign(o.delivery, {
      recipientName: name.trim(),
      recipientRelationship: relationship,
      deliveryNotes: notes.trim(),
      deliveredAt: this.stamp(),
      evidencePhotoUri: photoUri,
    });
    o.fulfillmentPlan.outbound.status = "COMPLETED";
    o.fulfillmentPlan.outbound.completedAt = this.stamp();
    this.state.driver.operationalStatus = "AVAILABLE";
    this.state.driver.completedDeliveriesCount++;
    this.event(o, "DELIVERED", `Entregado a ${name.trim()} (${relationship}).`);
  }
}
