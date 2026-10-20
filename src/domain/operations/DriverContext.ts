import {
  terminalStatuses,
  type AppState,
  type Order,
  type Role,
} from "../models";
import { visibleOrders } from "../selectors";
export class DriverContext {
  constructor(
    public state: AppState,
    public now = new Date(),
  ) {}
  protected id(prefix: string): string {
    return `${prefix}-${this.now.getTime()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  protected stamp(): string {
    return this.now.toISOString();
  }
  protected order(id: string, role?: Role): Order {
    const o = visibleOrders(this.state).find((o) => o.id === id);
    if (!o || (role && this.state.session?.role !== role))
      throw Error("No tienes acceso a esta solicitud.");
    if (
      this.state.session?.role === "DRIVER" &&
      this.state.driver.mustChangePassword
    )
      throw Error("Cambia tu contraseña temporal antes de iniciar servicios.");
    return o;
  }
  protected active(o: Order): void {
    if (terminalStatuses.includes(o.status))
      throw Error("La solicitud ya está cerrada.");
  }
  protected notify(o: Order, title: string, body: string): void {
    this.state.notifications.unshift({
      id: this.id("notif"),
      customerId: o.customerId,
      title,
      body,
      category: "PEDIDO",
      timeAgo: "Ahora",
      isRead: false,
      relatedOrderId: o.id,
    });
  }
}
