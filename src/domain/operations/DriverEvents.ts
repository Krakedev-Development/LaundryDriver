import { statusLabels, type Order, type OrderStatus } from "../models";
import { DriverContext } from "./DriverContext";
export class DriverEvents extends DriverContext {
  protected event(
    o: Order,
    status: OrderStatus,
    description = "",
    title: string = statusLabels[status],
  ): void {
    o.status = status;
    const index = o.timeline.findIndex(
      (e) => e.status === status && !e.completed,
    );
    if (index >= 0)
      o.timeline.slice(0, index + 1).forEach((e) => {
        if (!e.completed) {
          e.completed = true;
          e.timestamp = this.stamp();
        }
      });
    o.timeline.push({
      status,
      title,
      description,
      timestamp: this.stamp(),
      completed: true,
    });
    this.notify(o, title, description || statusLabels[status]);
  }
}
