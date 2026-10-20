import { type OrderStatus } from "./statuses";
import { type Leg, type FulfillmentPlan, type Handoff } from "./fulfillment";
import {
  type OrderItem,
  type OrderExtra,
  type OrderPricing,
  type PricingModel,
  type PricingStatus,
  type Adjustment,
} from "./pricing";
export interface PickupInfo {
  addressId: string;
  addressTitle: string;
  addressFull: string;
  date: string;
  timeSlot: string;
  notes: string;
  pickedUpAt?: string;
  garmentCountConfirmed?: number;
  evidencePhotoUri?: string;
}
export interface DeliveryInfo {
  addressId: string;
  addressTitle: string;
  addressFull: string;
  date: string;
  timeSlot: string;
  recipientName?: string;
  recipientRelationship?: string;
  deliveredAt?: string;
  deliveryNotes?: string;
  evidencePhotoUri?: string;
}
export interface TimelineEvent {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}
export interface Order {
  /** Previous intake retained only as history, never as an available method. */
  legacyInbound?: Leg;
  pickupNeedsScheduling?: boolean;
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  priority: boolean;
  items: OrderItem[];
  extras: OrderExtra[];
  pricing: OrderPricing;
  promotionCode?: string;
  pickup: PickupInfo;
  delivery: DeliveryInfo;
  facilityName: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedDriverVehicle?: string;
  assignedDriverPlate?: string;
  paymentMethod: string;
  paymentStatus: "PAGADO" | "PENDIENTE" | "PENDIENTE_PESO" | "REEMBOLSADO";
  timeline: TimelineEvent[];
  createdAt: string;
  fulfillmentPlan: FulfillmentPlan;
  pricingModel: PricingModel;
  pricingStatus: PricingStatus;
  weightLb?: number;
  weightKg?: number;
  estimatedWeightLb?: number;
  pricePerLb: number;
  handoffs: Handoff[];
  adjustments: Adjustment[];
  canChangeOutboundMethod: boolean;
}
export const money = (n: number) => `$${n.toFixed(2)}`;
export const round = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;
export const garmentCount = (o: Order) =>
  o.items.reduce((sum, i) => sum + i.quantity, 0);
export const canTrack = (o: Order) =>
  ["HEADING_TO_PICKUP", "OUT_FOR_DELIVERY"].includes(o.status);
