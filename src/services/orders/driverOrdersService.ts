import type {
  DeliveryInfo,
  FulfillmentPlan,
  Leg,
  Order,
  OrderItem,
  OrderPricing,
  OrderStatus,
  PickupInfo,
  PricingStatus,
  TimelineEvent,
} from "../../domain/models";
import { facilities } from "../../domain/catalog";
import { apiClient } from "../api/apiClient";
import { getStoredAuthSession } from "../auth/authService";

// Centro del mapa cuando el servidor no entrega coordenadas de una parada.
export const GUAYAQUIL_COORDINATES = {
  center: { latitude: -2.1894, longitude: -79.8891 },
} as const;

export interface BackendOrderSummary {
  id: string;
  number: number;
  status: string;
  mode: "HOME_HOME" | "HOME_STORE";
  facilityId: string;
  paymentStatus: string;
  pricingStatus: string;
  total: string | number;
  version: number;
  createdAt: string;
}

export interface BackendOrderListResponse {
  page: number;
  pageSize: number;
  total: number;
  data: BackendOrderSummary[];
}

export interface BackendOrderLeg {
  id: string;
  kind: "INBOUND" | "OUTBOUND";
  method: "DRIVER" | "CUSTOMER";
  addressText: string;
  latitude: number | string;
  longitude: number | string;
  slot?: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null;
  driver?: {
    userId: string;
    name?: string;
    phone?: string;
  } | null;
}

export interface BackendOrderItem {
  id: string;
  garmentId: string;
  serviceId: string;
  quantity: number;
  unitPrice: string | number;
  notes?: string | null;
}

export interface BackendOrderExtra {
  id: string;
  extraId: string;
  price: string | number;
}

export interface BackendOrderEvent {
  id: string;
  status: string;
  title: string;
  note?: string | null;
  createdAt: string;
}

export interface BackendOrderDetails extends BackendOrderSummary {
  customerId?: string;
  notes?: string | null;
  pricingModel?: "FIXED" | "PER_WEIGHT";
  estimatedWeightLb?: number | null;
  pricePerPound?: string | number | null;
  itemsSubtotal?: string | number;
  extrasTotal?: string | number;
  discount?: string | number;
  membershipDiscount?: string | number;
  logisticsFee?: string | number;
  tax?: string | number;
  items?: BackendOrderItem[];
  extras?: BackendOrderExtra[];
  legs?: BackendOrderLeg[];
  events?: BackendOrderEvent[];
}

export interface ListOrdersQuery {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface UpdateDriverLocationPayload {
  latitude: number;
  longitude: number;
  status?: "AVAILABLE" | "ON_SERVICE" | "BREAK" | "OFFLINE";
}

export interface BackendDriverProfile {
  id: string;
  userId: string;
  facilityId: string | null;
  vehicle: string | null;
  plate: string | null;
  status: "AVAILABLE" | "ON_SERVICE" | "BREAK" | "OFFLINE";
  latitude: number | null;
  longitude: number | null;
  locationAt: string | null;
  user?: {
    name: string;
    email: string;
    phone: string | null;
  };
  facility?: {
    name: string;
  } | null;
  activeLegsCount?: number;
}

export interface TransitionPayload {
  to: string;
  expectedVersion: number;
  note?: string;
}

async function resolveToken(explicitToken?: string | null): Promise<string> {
  if (explicitToken !== undefined && explicitToken !== null) {
    return explicitToken;
  }
  const session = await getStoredAuthSession();
  if (!session.accessToken) {
    throw new Error("No hay una sesión activa con token de acceso.");
  }
  return session.accessToken;
}

function normalizeCoordinates(
  lat: number | string | undefined,
  lng: number | string | undefined,
  fallback: { latitude: number; longitude: number },
): { latitude: number; longitude: number } {
  const nLat = typeof lat === "string" ? parseFloat(lat) : Number(lat);
  const nLng = typeof lng === "string" ? parseFloat(lng) : Number(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng) || nLat === 0 || nLat < -8) {
    return fallback;
  }
  return { latitude: nLat, longitude: nLng };
}

export function mapBackendOrderToDomain(
  raw: BackendOrderSummary | BackendOrderDetails,
  fallbackDriverName = "Chofer",
): Order {
  const totalNum =
    typeof raw.total === "string" ? parseFloat(raw.total) : (raw.total ?? 0);
  const itemsSubtotalNum =
    "itemsSubtotal" in raw && raw.itemsSubtotal
      ? parseFloat(String(raw.itemsSubtotal))
      : totalNum;
  const deliveryFeeNum =
    "logisticsFee" in raw && raw.logisticsFee
      ? parseFloat(String(raw.logisticsFee))
      : 0;

  const inboundLeg =
    "legs" in raw && raw.legs
      ? raw.legs.find((l) => l.kind === "INBOUND")
      : undefined;
  const outboundLeg =
    "legs" in raw && raw.legs
      ? raw.legs.find((l) => l.kind === "OUTBOUND")
      : undefined;

  const inboundCoords = normalizeCoordinates(
    inboundLeg?.latitude,
    inboundLeg?.longitude,
    GUAYAQUIL_COORDINATES.center,
  );

  const outboundCoords = normalizeCoordinates(
    outboundLeg?.latitude,
    outboundLeg?.longitude,
    GUAYAQUIL_COORDINATES.center,
  );

  const inboundDomainLeg: Leg = {
    method: (inboundLeg?.method as Leg["method"]) ?? "DRIVER",
    addressFull: inboundLeg?.addressText || "Dirección no disponible",
    scheduledDate: inboundLeg?.slot?.date
      ? inboundLeg.slot.date.slice(0, 10)
      : "Sin fecha",
    timeSlotId: inboundLeg?.slot?.id,
    timeSlotText: inboundLeg?.slot
      ? `${inboundLeg.slot.startTime} - ${inboundLeg.slot.endTime}`
      : "Sin horario",
    status: "SCHEDULED",
    latitude: inboundCoords.latitude,
    longitude: inboundCoords.longitude,
  };

  const outboundDomainLeg: Leg = {
    method:
      (outboundLeg?.method as Leg["method"]) ??
      (raw.mode === "HOME_STORE" ? "CUSTOMER" : "DRIVER"),
    addressFull: outboundLeg?.addressText || "Dirección no disponible",
    scheduledDate: outboundLeg?.slot?.date
      ? outboundLeg.slot.date.slice(0, 10)
      : "Sin fecha",
    timeSlotId: outboundLeg?.slot?.id,
    timeSlotText: outboundLeg?.slot
      ? `${outboundLeg.slot.startTime} - ${outboundLeg.slot.endTime}`
      : "Sin horario",
    status: "SCHEDULED",
    latitude: outboundCoords.latitude,
    longitude: outboundCoords.longitude,
  };

  const pricing: OrderPricing = {
    itemsSubtotal: itemsSubtotalNum,
    extrasTotal:
      "extrasTotal" in raw && raw.extrasTotal
        ? parseFloat(String(raw.extrasTotal))
        : 0,
    discount:
      "discount" in raw && raw.discount
        ? parseFloat(String(raw.discount))
        : 0,
    membershipBenefitDiscount:
      "membershipDiscount" in raw && raw.membershipDiscount
        ? parseFloat(String(raw.membershipDiscount))
        : 0,
    deliveryFee: deliveryFeeNum,
    total: totalNum,
  };

  const pickup: PickupInfo = {
    addressId: inboundDomainLeg.addressId ?? "addr-pickup",
    addressTitle: "Recogida a domicilio",
    addressFull: inboundDomainLeg.addressFull,
    date: inboundDomainLeg.scheduledDate,
    timeSlot: inboundDomainLeg.timeSlotText,
    notes: ("notes" in raw && raw.notes) || "",
    pickedUpAt: [
      "PICKED_UP",
      "HEADING_TO_FACILITY",
      "AT_FACILITY",
      "IN_PROCESS",
      "DELIVERED",
      "COMPLETED",
    ].includes(raw.status)
      ? raw.createdAt
      : undefined,
  };

  const delivery: DeliveryInfo = {
    addressId: outboundDomainLeg.addressId ?? "addr-delivery",
    addressTitle:
      raw.mode === "HOME_STORE"
        ? "Retiro en sede"
        : "Entrega a domicilio",
    addressFull: outboundDomainLeg.addressFull,
    date: outboundDomainLeg.scheduledDate,
    timeSlot: outboundDomainLeg.timeSlotText,
    deliveredAt: ["DELIVERED", "COMPLETED"].includes(raw.status)
      ? raw.createdAt
      : undefined,
  };

  const fulfillmentPlan: FulfillmentPlan = {
    mode: raw.mode ?? "HOME_HOME",
    inbound: inboundDomainLeg,
    outbound: outboundDomainLeg,
  };

  const domainItems: OrderItem[] =
    "items" in raw && raw.items && raw.items.length > 0
      ? raw.items.map((it) => ({
          id: it.garmentId,
          garmentType: "Prenda de lavandería",
          quantity: it.quantity,
          serviceType: "Servicio estándar",
          unitPrice:
            typeof it.unitPrice === "string"
              ? parseFloat(it.unitPrice)
              : it.unitPrice,
          notes: it.notes ?? "",
          iconName: "shirt-outline",
        }))
      : [
          {
            id: "garment-default",
            garmentType: "Carga de prendas",
            quantity: 1,
            serviceType: "Lavado y planchado",
            unitPrice: totalNum,
            notes: "",
            iconName: "shirt-outline",
          },
        ];

  const timeline: TimelineEvent[] =
    "events" in raw && raw.events && raw.events.length > 0
      ? raw.events.map((ev) => ({
          status: (ev.status as OrderStatus) ?? "CONFIRMED",
          title: ev.title,
          description: ev.note ?? "",
          timestamp: ev.createdAt,
          completed: true,
        }))
      : [
          {
            status: (raw.status as OrderStatus) ?? "CONFIRMED",
            title: `Estado: ${raw.status}`,
            description: "",
            timestamp: raw.createdAt,
            completed: true,
          },
        ];

  const assignedFacility =
    facilities.find((f) => f.id === raw.facilityId)?.name || "Sede asignada";

  return {
    id: raw.id,
    customerId: ("customerId" in raw && raw.customerId) || "",
    customerName: "Cliente",
    customerPhone: "",
    status: (raw.status as OrderStatus) ?? "PICKUP_ASSIGNED",
    priority: false,
    items: domainItems,
    extras: [],
    pricing,
    pickup,
    delivery,
    facilityName: assignedFacility,
    assignedDriverName: fallbackDriverName,
    paymentMethod: "",
    paymentStatus: raw.paymentStatus === "PAID" ? "PAGADO" : "PENDIENTE",
    timeline,
    createdAt: raw.createdAt,
    fulfillmentPlan,
    pricingModel: ("pricingModel" in raw && raw.pricingModel) || "FIXED",
    pricingStatus: (raw.pricingStatus as PricingStatus) || "CALCULATED",
    pricePerLb:
      "pricePerPound" in raw && raw.pricePerPound
        ? parseFloat(String(raw.pricePerPound))
        : 0,
    handoffs: [],
    adjustments: [],
    canChangeOutboundMethod: false,
    version: raw.version ?? 1,
  };
}

export const driverOrdersService = {
  async getAssignedOrders(
    query?: ListOrdersQuery,
    explicitToken?: string | null,
  ): Promise<Order[]> {
    const token = await resolveToken(explicitToken);
    const searchParams = new URLSearchParams();
    if (query?.status) searchParams.set("status", query.status);
    if (query?.page) searchParams.set("page", String(query.page));
    if (query?.pageSize) searchParams.set("pageSize", String(query.pageSize));

    const qs = searchParams.toString();
    const endpoint = `/orders${qs ? `?${qs}` : ""}`;

    const response = await apiClient.get<
      BackendOrderListResponse | BackendOrderSummary[]
    >(endpoint, {
      accessToken: token,
    });

    const summaries: BackendOrderSummary[] = Array.isArray(response)
      ? response
      : response.data ?? [];

    if (summaries.length === 0) {
      return [];
    }

    const detailedOrders = await Promise.all(
      summaries.map(async (summary) => {
        try {
          const detail = await this.getOrder(summary.id, token);
          return mapBackendOrderToDomain(detail);
        } catch {
          return mapBackendOrderToDomain(summary);
        }
      }),
    );

    return detailedOrders;
  },

  async getRawAssignedOrders(
    query?: ListOrdersQuery,
    explicitToken?: string | null,
  ): Promise<BackendOrderListResponse> {
    const token = await resolveToken(explicitToken);
    const searchParams = new URLSearchParams();
    if (query?.status) searchParams.set("status", query.status);
    if (query?.page) searchParams.set("page", String(query.page));
    if (query?.pageSize) searchParams.set("pageSize", String(query.pageSize));

    const qs = searchParams.toString();
    const endpoint = `/orders${qs ? `?${qs}` : ""}`;

    const response = await apiClient.get<
      BackendOrderListResponse | BackendOrderSummary[]
    >(endpoint, {
      accessToken: token,
    });

    if (Array.isArray(response)) {
      return {
        page: 1,
        pageSize: response.length,
        total: response.length,
        data: response,
      };
    }
    return response;
  },

  async getOrder(
    id: string,
    explicitToken?: string | null,
  ): Promise<BackendOrderDetails> {
    const token = await resolveToken(explicitToken);
    return await apiClient.get<BackendOrderDetails>(`/orders/${id}`, {
      accessToken: token,
    });
  },

  async transitionOrder(
    orderId: string,
    to: string,
    expectedVersion: number,
    note?: string,
    explicitToken?: string | null,
  ): Promise<BackendOrderDetails> {
    const token = await resolveToken(explicitToken);
    return await apiClient.post<BackendOrderDetails>(
      `/orders/${orderId}/transitions`,
      {
        to,
        expectedVersion,
        note,
      },
      {
        accessToken: token,
      },
    );
  },

  async confirmPickup(
    orderId: string,
    expectedVersion: number,
    note?: string,
    explicitToken?: string | null,
  ): Promise<BackendOrderDetails> {
    return await this.transitionOrder(
      orderId,
      "PICKED_UP",
      expectedVersion,
      note,
      explicitToken,
    );
  },

  async confirmFacilityArrival(
    orderId: string,
    expectedVersion: number,
    note?: string,
    explicitToken?: string | null,
  ): Promise<BackendOrderDetails> {
    return await this.transitionOrder(
      orderId,
      "AT_FACILITY",
      expectedVersion,
      note,
      explicitToken,
    );
  },

  async confirmDelivery(
    orderId: string,
    expectedVersion: number,
    note?: string,
    explicitToken?: string | null,
  ): Promise<BackendOrderDetails> {
    return await this.transitionOrder(
      orderId,
      "DELIVERED",
      expectedVersion,
      note,
      explicitToken,
    );
  },

  async updateLocation(
    payload: UpdateDriverLocationPayload,
    explicitToken?: string | null,
  ): Promise<BackendDriverProfile> {
    const token = await resolveToken(explicitToken);
    return await apiClient.patch<BackendDriverProfile>(
      "/drivers/me/location",
      payload,
      {
        accessToken: token,
      },
    );
  },
};
