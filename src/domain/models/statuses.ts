export type OrderStatus = keyof typeof statusLabels;
// Etiquetas desde el punto de vista del chofer (la app del cliente tiene las suyas: "Chofer en tu
// puerta", "Requiere tu aprobación"...). Se usan en los estados, el historial y los avisos.
export const statusLabels = {
  CREATED: "Solicitud creada",
  DRAFT: "Borrador",
  PAYMENT_PENDING: "Pago pendiente",
  CONFIRMED: "Solicitud confirmada",
  AWAITING_INTAKE: "Recogida pendiente",
  PICKUP_PENDING: "Recogida pendiente",
  PICKUP_ASSIGNED: "Recogida asignada",
  HEADING_TO_PICKUP: "En camino a recoger",
  ARRIVED_FOR_PICKUP: "En el domicilio del cliente",
  PICKED_UP: "Ropa recogida",
  HEADING_TO_FACILITY: "En camino a planta",
  AT_FACILITY: "En planta",
  WEIGHING: "Pesaje en curso",
  INSPECTION: "Inspección de prendas",
  PRICING_PENDING: "Cálculo de valor final",
  CUSTOMER_APPROVAL_PENDING: "Esperando aprobación del cliente",
  IN_PROCESS: "En lavado y cuidado",
  QUALITY_CONTROL: "Control de calidad",
  READY_FOR_DELIVERY: "Lista para entrega",
  READY_FOR_PICKUP: "Lista para retirar en sede",
  DELIVERY_SCHEDULED: "Entrega programada",
  DELIVERY_ASSIGNED: "Por retirar en planta",
  OUT_FOR_DELIVERY: "En camino a entrega",
  ARRIVED_FOR_DELIVERY: "En el domicilio de entrega",
  DELIVERED: "Entregado",
  COMPLETED: "Completado",
  CLOSED: "Finalizado",
  INCIDENT: "Incidencia en revisión",
  CANCELLED: "Cancelado",
} as const;
export const terminalStatuses: OrderStatus[] = [
  "DELIVERED",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
];
export const pickupStatuses: OrderStatus[] = [
  "PICKUP_ASSIGNED",
  "HEADING_TO_PICKUP",
  "ARRIVED_FOR_PICKUP",
  "PICKED_UP",
  "HEADING_TO_FACILITY",
];
export const deliveryStatuses: OrderStatus[] = [
  "DELIVERY_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "ARRIVED_FOR_DELIVERY",
];
