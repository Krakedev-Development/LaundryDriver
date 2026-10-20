import { initialSlots } from "./catalog";
import { createSeedState } from "./seed";
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
export function initializeState(now = new Date()): AppState {
  const s = createSeedState();
  s.timeSlots.forEach((slot) => {
    slot.date = scheduleDate(slot.date, now);
  });
  s.orders.forEach((o) => {
    o.pickup.date = scheduleDate(o.pickup.date, now);
    o.delivery.date = scheduleDate(o.delivery.date, now);
    o.fulfillmentPlan.inbound.scheduledDate = o.pickup.date;
    o.fulfillmentPlan.outbound.scheduledDate = o.delivery.date;
  });
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
