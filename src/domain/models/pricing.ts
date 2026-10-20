export type PricingModel = "FIXED" | "PER_WEIGHT";
export type PricingStatus =
  | "ESTIMATED"
  | "PENDING_WEIGHT"
  | "CALCULATED"
  | "ADJUSTMENT_PENDING"
  | "FINAL";
export interface OrderItem {
  id: string;
  garmentType: string;
  quantity: number;
  serviceType: string;
  unitPrice: number;
  notes: string;
  iconName: string;
}
export interface OrderExtra {
  id: string;
  name: string;
  description: string;
  price: number;
  selected?: boolean;
}
export interface OrderPricing {
  itemsSubtotal: number;
  extrasTotal: number;
  discount: number;
  membershipBenefitDiscount: number;
  deliveryFee: number;
  total: number;
}
export interface Adjustment {
  id: string;
  orderId: string;
  type:
    | "SERVICE_RECLASSIFICATION"
    | "EXTRA_ITEM"
    | "WEIGHT_ADJUSTMENT"
    | "PRICE_ADJUSTMENT";
  description: string;
  amountDifference: number;
  requiresCustomerApproval: boolean;
  status: "PENDING_CUSTOMER" | "APPROVED" | "REJECTED";
  createdAt: string;
  resolvedAt?: string;
}
export interface Promo {
  code: string;
  discountPercent: number;
  fixedDiscount: number;
  minOrderAmount: number;
  description: string;
  validUntil: string;
}
export interface MembershipPlan {
  id: string;
  name: string;
  priceMonthly: number;
  weeklyPickups: number;
  garmentDiscountPercent: number;
  benefits: string[];
}
