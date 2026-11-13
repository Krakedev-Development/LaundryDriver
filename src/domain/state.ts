import { initialSlots } from "./catalog";
import { type AppState } from "./models";
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export function today(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function scheduleDate(date: string, now = new Date()): string {
  if (/^hoy$/i.test(date)) return today(now);
  if (/^mañana$/i.test(date)) return today(new Date(now.getTime() + 86400000));
  return date;
}
// El producto arranca sin datos: el chofer, sus servicios y los cupos llegan de la API.
export function initializeState(now = new Date()): AppState {
  const s: AppState = {
    version: 1,
    customers: [],
    driver: {
      id: "",
      name: "",
      email: "",
      phone: "",
      operationalStatus: "AVAILABLE",
      vehicleModel: "",
      vehicleColor: "",
      vehiclePlate: "",
      facilityName: "",
      zoneName: "",
      mustChangePassword: false,
      currentLat: -2.1894,
      currentLng: -79.8891,
      completedDeliveriesCount: 0,
    },
    session: null,
    accounts: [],
    orders: [],
    notifications: [],
    chatMessages: {},
    timeSlots: [],
  };
  refreshSchedule(s, now);
  return s;
}
export function refreshSchedule(s: AppState, now = new Date()): void {
  for (let day = 0; day <= 7; day++) {
    const date = today(new Date(now.getTime() + day * 86400000));
    for (const template of initialSlots) {
      if (
        day === 0 &&
        ["DRIVER_DELIVERY", "FACILITY_PICKUP"].includes(template.context)
      )
        continue;
      if (
        s.timeSlots.some(
          (slot) =>
            slot.date === date &&
            slot.context === template.context &&
            slot.startTime === template.startTime &&
            slot.endTime === template.endTime,
        )
      )
        continue;
      s.timeSlots.push({
        ...template,
        id: `${template.id}:${date}`,
        date,
        reservedCount: 0,
      });
    }
  }
}
