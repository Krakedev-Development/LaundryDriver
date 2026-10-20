import { facilities, initialSlots } from "./catalog";
import { handoffLabels, modeFor, statusLabels, type AppState, type Customer, type Handoff, type HandoffType, type Leg, type Method, type Order, type OrderItem, type OrderStatus } from "./models";
export const DEMO_PASSWORD_HASH =
  "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";
export function seedCustomer(): Customer {
  return {id: "cust-1",
name: "María Elena Torres",
email: "maria.torres@gmail.com",
phone: "+51 987 654 321",
addresses: [
      {
        id: "addr-1",
        title: "Casa",
        fullAddress: "Calle Los Sauces 421, Dpto 502, Miraflores",
        reference: "Timbre 502, frente al parque",
        isPrimary: true,
        latitude: -12.0965,
        longitude: -77.0354,
      },
      {
        id: "addr-2",
        title: "Trabajo",
        fullAddress: "Av. Javier Prado Este 2450, Piso 8, San Isidro",
        reference: "Recepción corporativa",
        isPrimary: false,
        latitude: -12.091,
        longitude: -77.012,
      },
    ],
membershipTier: "Estándar"};
}
export function seedLeg(
  method: Method,
  outbound = false,
  facilityIndex = 0,
): Leg {
  const f = facilities[facilityIndex];
  const a = seedCustomer().addresses[0];
  return {
    method,
    facilityId: method === "CUSTOMER" ? f.id : undefined,
    facilityName: method === "CUSTOMER" ? f.name : undefined,
    addressId: method === "DRIVER" ? a.id : undefined,
    addressFull: method === "DRIVER" ? a.fullAddress : f.address,
    scheduledDate: outbound ? "Mañana" : "Hoy",
    timeSlotText: "16:00 - 18:00",
    status: "SCHEDULED",
    latitude: method === "DRIVER" ? a.latitude : f.latitude,
    longitude: method === "DRIVER" ? a.longitude : f.longitude,
  };
}
export function seedHandoff(
  orderId: string,
  type: HandoffType,
  fallbackCode: string,
  status: Handoff["status"] = "ACTIVE",
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
const item = (
  id: string,
  garmentType: string,
  quantity: number,
  serviceType: string,
  unitPrice: number,
): OrderItem => ({
  id,
  garmentType,
  quantity,
  serviceType,
  unitPrice,
  notes: "",
  iconName: "shirt-outline",
});
function seedOrder(
  id: string,
  status: OrderStatus,
  inbound: Method,
  outbound: Method,
  patch: Partial<Order> = {},
): Order {
  const inLeg = seedLeg(inbound);
  const outLeg = seedLeg(outbound, true);
  const c = seedCustomer();
  const statuses: OrderStatus[] = [
    "CONFIRMED",
    inbound === "DRIVER" ? "PICKUP_ASSIGNED" : "AWAITING_INTAKE",
    "PICKED_UP",
    "AT_FACILITY",
    "IN_PROCESS",
    outbound === "DRIVER" ? "READY_FOR_DELIVERY" : "READY_FOR_PICKUP",
    "DELIVERED",
  ];
  let position = statuses.indexOf(status);
  if (status === "HEADING_TO_PICKUP") position = 1;
  if (["WEIGHING", "CUSTOMER_APPROVAL_PENDING"].includes(status)) position = 3;
  if (status === "DELIVERY_ASSIGNED") position = 5;
  return {
    id,
    customerId: c.id,
    customerName: c.name,
    customerPhone: c.phone,
    status,
    priority: false,
    items: [],
    extras: [],
    pricing: {
      itemsSubtotal: 0,
      extrasTotal: 0,
      discount: 0,
      membershipBenefitDiscount: 0,
      deliveryFee: 0,
      total: 0,
    },
    pickup: {
      addressId: inLeg.addressId ?? inLeg.facilityId!,
      addressTitle: inbound === "DRIVER" ? "Casa" : facilities[0].name,
      addressFull: inLeg.addressFull,
      date: "Hoy",
      timeSlot: inLeg.timeSlotText,
      notes: "Dejar en conserjería si no contesto el timbre",
    },
    delivery: {
      addressId: outLeg.addressId ?? outLeg.facilityId!,
      addressTitle: outbound === "DRIVER" ? "Casa" : facilities[0].name,
      addressFull: outLeg.addressFull,
      date: "Mañana",
      timeSlot: outLeg.timeSlotText,
    },
    facilityName: facilities[0].name,
    assignedDriverId:
      inbound === "DRIVER" || outbound === "DRIVER" ? "drv-1" : undefined,
    assignedDriverName: "Carlos Mendoza",
    assignedDriverPhone: "+51 912 345 678",
    assignedDriverVehicle: "Renault Kangoo Maxi (Blanco)",
    assignedDriverPlate: "ABC-789",
    paymentMethod: "Billetera Laundry",
    paymentStatus: "PAGADO",
    createdAt: "Hoy 14:15",
    fulfillmentPlan: {
      mode: modeFor(inbound, outbound),
      inbound: inLeg,
      outbound: outLeg,
    },
    pricingModel: "FIXED",
    pricingStatus: "FINAL",
    pricePerLb: 2.2,
    handoffs: [],
    adjustments: [],
    canChangeOutboundMethod: true,
    timeline: statuses.map((s, i) => ({
      status: s,
      title: statusLabels[s],
      description: "",
      timestamp: i <= position ? "Hoy 14:15" : "Pendiente",
      completed: i <= position,
    })),
    ...patch,
  };
}
export function createSeedState(): AppState {
  const hh = seedOrder("SOL-4587", "HEADING_TO_PICKUP", "DRIVER", "DRIVER", {
    items: [
      item("it-1", "Camisas / Blusas", 4, "Lavado + Planchado", 4),
      item("it-2", "Pantalones / Jeans", 2, "Lavado ecológico", 3),
      item("it-3", "Juego de Sábanas", 1, "Lavado + Secado", 5),
    ],
    extras: [
      {
        id: "ext-2",
        name: "Perfumado Clean & Fresh",
        description: "Esencia botánica",
        price: 1,
        selected: true,
      },
    ],
    pricing: {
      itemsSubtotal: 27,
      extrasTotal: 1,
      discount: 2.8,
      membershipBenefitDiscount: 3.24,
      deliveryFee: 0,
      total: 21.96,
    },
    promotionCode: "FRESH10",
    handoffs: [seedHandoff("SOL-4587", "CUSTOMER_TO_DRIVER", "482910")],
  });
  const hs = seedOrder("SOL-HS-001", "READY_FOR_PICKUP", "DRIVER", "CUSTOMER", {
    items: [
      item("it-hs1", "Traje sastre (2 piezas)", 1, "Tratamiento especial", 9),
      item("it-hs2", "Vestidos", 2, "Lavado + Planchado", 6.5),
    ],
    pricing: {
      itemsSubtotal: 22,
      extrasTotal: 0,
      discount: 0,
      membershipBenefitDiscount: 2.64,
      deliveryFee: 0,
      total: 19.36,
    },
    handoffs: [seedHandoff("SOL-HS-001", "FACILITY_TO_CUSTOMER", "749201")],
  });
  hs.fulfillmentPlan.inbound.status = "COMPLETED";
  const ss = seedOrder("SOL-SS-001", "PICKUP_ASSIGNED", "DRIVER", "CUSTOMER", {
    items: [
      item("it-ss1", "Edredón / Plumón", 1, "Lavado especial", 8),
      item("it-ss2", "Toallas (juego x2)", 2, "Lavado ecológico", 3.2),
    ],
    pricing: {
      itemsSubtotal: 14.4,
      extrasTotal: 0,
      discount: 0,
      membershipBenefitDiscount: 1.72,
      deliveryFee: 0,
      total: 12.68,
    },
    handoffs: [seedHandoff("SOL-SS-001", "CUSTOMER_TO_DRIVER", "392814")],
    facilityName: facilities[1].name,
  });
  ss.fulfillmentPlan.inbound = seedLeg("DRIVER", false, 1);
  ss.fulfillmentPlan.outbound = seedLeg("CUSTOMER", true, 1);
  ss.delivery.addressTitle = facilities[1].name;
  ss.delivery.addressFull = facilities[1].address;
  const weight = seedOrder("SOL-WEIGHT-001", "WEIGHING", "DRIVER", "DRIVER", {
    pricingModel: "PER_WEIGHT",
    pricingStatus: "CALCULATED",
    paymentStatus: "PENDIENTE",
    weightLb: 18.5,
    weightKg: 8.39,
    pricing: {
      itemsSubtotal: 40.7,
      extrasTotal: 1,
      discount: 4.07,
      membershipBenefitDiscount: 4.88,
      deliveryFee: 0,
      total: 32.75,
    },
    extras: [
      {
        id: "ext-2",
        name: "Perfumado Clean & Fresh",
        description: "Esencia botánica",
        price: 1,
        selected: true,
      },
    ],
    handoffs: [
      seedHandoff("SOL-WEIGHT-001", "DRIVER_TO_CUSTOMER", "551982", "PENDING"),
    ],
  });
  weight.fulfillmentPlan.inbound.status = "COMPLETED";
  const adj = seedOrder(
    "SOL-ADJ-002",
    "CUSTOMER_APPROVAL_PENDING",
    "DRIVER",
    "DRIVER",
    {
      items: [item("it-a1", "Camisas / Blusas", 3, "Lavado ecológico", 2.5)],
      pricing: {
        itemsSubtotal: 7.5,
        extrasTotal: 0,
        discount: 0,
        membershipBenefitDiscount: 0.9,
        deliveryFee: 0,
        total: 6.6,
      },
      adjustments: [
        {
          id: "adj-1",
          orderId: "SOL-ADJ-002",
          type: "SERVICE_RECLASSIFICATION",
          description:
            "Prenda de seda delicada detectada durante la inspección. Requiere Tratamiento Especial para evitar decoloración.",
          amountDifference: 4.5,
          requiresCustomerApproval: true,
          status: "PENDING_CUSTOMER",
          createdAt: "Hoy 13:40",
        },
      ],
    },
  );
  adj.fulfillmentPlan.inbound.status = "COMPLETED";
  const sh = seedOrder("SOL-SH-001", "DELIVERY_ASSIGNED", "DRIVER", "DRIVER", {
    items: [item("it-sh1", "Camisas / Blusas", 2, "Lavado + Planchado", 4)],
    pricing: {
      itemsSubtotal: 8,
      extrasTotal: 0,
      discount: 0,
      membershipBenefitDiscount: 0.96,
      deliveryFee: 0,
      total: 7.04,
    },
    handoffs: [
      seedHandoff("SOL-SH-001", "DRIVER_TO_CUSTOMER", "620148", "PENDING"),
    ],
  });
  sh.fulfillmentPlan.inbound.status = "COMPLETED";
  return {version: 1,
customers: [seedCustomer()],
driver: {
      id: "drv-1",
      name: "Carlos Mendoza",
      email: "carlos.mendoza@laundryfresh.com",
      phone: "+51 912 345 678",
      operationalStatus: "AVAILABLE",
      vehicleModel: "Renault Kangoo Maxi",
      vehicleColor: "Blanco",
      vehiclePlate: "ABC-789",
      facilityName: facilities[0].name,
      zoneName: "Zona Centro - Miraflores",
      mustChangePassword: false,
      currentLat: -12.094,
      currentLng: -77.032,
      completedDeliveriesCount: 34,
    },
session:null,
accounts:[{
        id: "drv-1",
        email: "carlos.mendoza@laundryfresh.com",
        role: "DRIVER",
        passwordHash: DEMO_PASSWORD_HASH,
      }],
orders: [hh, weight, adj, hs, ss, sh],
notifications: [
      {
        id: "notif-1",
        customerId: "cust-1",
        title: "Chofer asignado",
        body: "Carlos Mendoza será tu chofer para la recogida de SOL-4587.",
        category: "CHOFER",
        timeAgo: "Hace 20 min",
        isRead: false,
        relatedOrderId: "SOL-4587",
      },
      {
        id: "notif-2",
        customerId: "cust-1",
        title: "Solicitud confirmada",
        body: "Tu solicitud SOL-4587 está agendada para hoy de 16:00 a 18:00.",
        category: "PEDIDO",
        timeAgo: "Hace 1 hora",
        isRead: true,
        relatedOrderId: "SOL-4587",
      },
      {
        id: "notif-3",
        customerId: "cust-1",
        title: "Puntos acumulados",
        body: "Ganaste +120 puntos Laundry Fresh con tu última orden.",
        category: "RECOMPENSA",
        timeAgo: "Ayer",
        isRead: true,
      },
    ],
chatMessages: {
      "SOL-4587": [
        {
          id: "m1",
          orderId: "SOL-4587",
          senderId: "drv-1",
          senderName: "Carlos Mendoza",
          senderRole: "DRIVER",
          text: "Hola María. Ya tengo tu recogida asignada y estaré en tu dirección en unos minutos.",
          timestamp: "15:40",
        },
        {
          id: "m2",
          orderId: "SOL-4587",
          senderId: "cust-1",
          senderName: "María Torres",
          senderRole: "CLIENT",
          text: "Hola Carlos. Las prendas están listas en la recepción del edificio.",
          timestamp: "15:42",
        },
      ],
    },
timeSlots: initialSlots.map((s) => ({ ...s }))};
}