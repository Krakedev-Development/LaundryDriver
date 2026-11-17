import type { Order } from "../../../domain/models";
import { ApiError } from "../../../services/api/apiClient";
import {
  driverOrdersService,
  mapBackendOrderToDomain,
  type HandoffType,
  type VerifyHandoffPayload,
} from "../../../services/orders/driverOrdersService";
import { CONFLICT_MESSAGE, OFFLINE_MESSAGE } from "./serverTransitions";

// Formato del QR que muestra la app del cliente: LDH1:<id de la solicitud>:<tipo>:<token>.
// El id permite avisar si el chofer escanea el QR de otra solicitud.
export const QR_PREFIX = "LDH1";

export const CODE_REQUIRED_MESSAGE =
  "Ingresa el código de 6 dígitos que muestra el cliente o escanea su QR.";
export const WRONG_ORDER_MESSAGE = "Este QR pertenece a otra solicitud.";
export const NO_CODE_MESSAGE =
  "El cliente todavía no generó su código. Pídele que toque «Mostrar código» en su app.";

export type CustodyInput = { code: string } | { qrToken: string };

/** Interpreta lo que el chofer escribió o escaneó. */
export function parseCustodyInput(
  raw: string,
  orderId: string,
  type: HandoffType,
): CustodyInput {
  const value = raw.trim();
  if (/^\d{6}$/.test(value)) return { code: value };
  const qr = value.match(/^LDH1:([^:]+):([A-Z_]+):(.{16,128})$/);
  if (qr) {
    if (qr[1] !== orderId) throw Error(WRONG_ORDER_MESSAGE);
    if (qr[2] !== type) throw Error("Este QR no corresponde a esta etapa del servicio.");
    return { qrToken: qr[3] };
  }
  throw Error(CODE_REQUIRED_MESSAGE);
}

/** Texto para mostrar qué se va a validar. */
export function describeCustodyInput(raw: string): string | null {
  const value = raw.trim();
  if (/^\d{6}$/.test(value)) return null;
  return value.startsWith(`${QR_PREFIX}:`) ? "QR del cliente leído" : null;
}

// Motivos frecuentes de una recogida fallida; "Otro" exige detalle.
export const FAILED_PICKUP_REASONS = [
  "Cliente ausente",
  "No responde llamadas ni mensajes",
  "Dirección incorrecta o inaccesible",
  "Otro",
] as const;

export function failedPickupReason(preset: string, detail: string): string {
  const extra = detail.trim();
  if (!preset) throw Error("Elige el motivo de la recogida fallida.");
  if (preset === "Otro" && !extra) throw Error("Describe qué pasó.");
  const reason = preset === "Otro" ? extra : extra ? `${preset}: ${extra}` : preset;
  if (reason.length > 300) throw Error("El motivo admite como máximo 300 caracteres.");
  return reason;
}

/** Reporta la recogida fallida en el servidor y devuelve la solicitud retenida. */
export async function reportFailedPickup(
  order: Pick<Order, "id" | "version">,
  reason: string,
  onRefresh: (latest: Order) => void,
): Promise<Order> {
  try {
    return mapBackendOrderToDomain(
      await driverOrdersService.reportFailedPickup(order.id, order.version ?? 1, reason),
    );
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 0) throw Error(OFFLINE_MESSAGE);
    if (error instanceof ApiError && error.statusCode === 409 && /versión|cambió/i.test(error.message)) {
      try {
        onRefresh(mapBackendOrderToDomain(await driverOrdersService.getOrder(order.id)));
      } catch {
        // Si no se puede recargar, el mensaje igual pide revisar la solicitud.
      }
      throw Error(CONFLICT_MESSAGE);
    }
    throw error;
  }
}

/**
 * Valida el traspaso en el servidor. Devuelve la solicitud actualizada. Los mensajes del
 * servidor (código incorrecto con intentos restantes, vencido o bloqueado) se muestran tal cual.
 */
export async function verifyCustody(
  order: Pick<Order, "id" | "version">,
  type: HandoffType,
  input: CustodyInput,
  extras: Omit<VerifyHandoffPayload, "type" | "expectedVersion" | "code" | "qrToken">,
  onRefresh: (latest: Order) => void,
): Promise<Order> {
  try {
    const updated = await driverOrdersService.verifyHandoff(order.id, {
      type,
      expectedVersion: order.version ?? 1,
      ...extras,
      ...input,
    } as VerifyHandoffPayload);
    return mapBackendOrderToDomain(updated);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 0) throw Error(OFFLINE_MESSAGE);
    if (error instanceof ApiError && error.statusCode === 409 && /versión|cambió/i.test(error.message)) {
      try {
        onRefresh(mapBackendOrderToDomain(await driverOrdersService.getOrder(order.id)));
      } catch {
        // Si no se puede recargar, el mensaje igual pide revisar la solicitud.
      }
      throw Error(CONFLICT_MESSAGE);
    }
    if (error instanceof ApiError && /No hay un código vigente/i.test(error.message))
      throw Error(NO_CODE_MESSAGE);
    throw error;
  }
}
