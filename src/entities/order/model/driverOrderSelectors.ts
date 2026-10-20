import {
  deliveryStatuses,
  pickupStatuses,
  terminalStatuses,
  type Order,
} from "../../../domain/models";
export function selectDriverServices(
  orders: Order[],
  upcoming: boolean,
  query: string,
) {
  const active = (order: Order) =>
    pickupStatuses.includes(order.status) ||
    deliveryStatuses.includes(order.status);
  return orders.filter(
    (order) =>
      !terminalStatuses.includes(order.status) &&
      active(order) !== upcoming &&
      (
        order.id +
        " " +
        order.customerName +
        " " +
        order.pickup.addressFull +
        " " +
        order.delivery.addressFull
      )
        .toLocaleLowerCase()
        .includes(query),
  );
}
export function selectDriverHistory(
  orders: Order[],
  filter: string,
  query: string,
) {
  return orders
    .filter(
      (order) =>
        terminalStatuses.includes(order.status) &&
        (order.id + " " + order.customerName)
          .toLocaleLowerCase()
          .includes(query),
    )
    .filter((order) => {
      if (filter === "Todos") return true;
      const stamp =
        order.delivery.deliveredAt ??
        order.timeline.find((e) => e.status === "CANCELLED")?.timestamp ??
        order.createdAt;
      const date = new Date(stamp).getTime();
      const age = Date.now() - date;
      return filter === "Hoy"
        ? age >= 0 && age < 86400000
        : age >= 0 && age < 7 * 86400000;
    });
}
