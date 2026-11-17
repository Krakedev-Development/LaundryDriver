import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { BottomSheet } from "../../../components/overlay/OverlayPortal";
import { Body, Button, useAction } from "../../../components/ui";
import type { Order, OrderStatus } from "../../../domain/models";
import {
  driverOrdersService,
  mapBackendOrderToDomain,
  type IssuedHandoff,
} from "../../../services/orders/driverOrdersService";
import { QR_PREFIX } from "../model/custody";

// Cada cuánto se consulta si la sede ya validó el código.
export const HANDOFF_POLL_MS = 5_000;

const minutesLeft = (expiresAt: string, now = Date.now()) =>
  Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 60_000));

/**
 * Código que el chofer muestra a la sede. Se genera en el servidor al abrir la hoja; mientras
 * está abierta se consulta la solicitud y, cuando la sede valida (estado `doneStatus`), avisa.
 */
export function DriverHandoffCode({
  order,
  type,
  doneStatus,
  title,
  description,
  visible,
  onClose,
  onDone,
}: {
  order: Pick<Order, "id">;
  type: "DRIVER_TO_FACILITY" | "FACILITY_TO_DRIVER";
  doneStatus: OrderStatus;
  title: string;
  description: string;
  visible: boolean;
  onClose(): void;
  onDone(updated: Order): void;
}) {
  const a = useAction();
  const [issued, setIssued] = useState<IssuedHandoff | null>(null);
  const [now, setNow] = useState(Date.now());
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const generate = () =>
    a.asyncRun(async () => {
      setIssued(await driverOrdersService.issueHandoff(order.id, type));
      setNow(Date.now());
    });

  // Al abrir se genera el código; al cerrar se descarta (el servidor no lo vuelve a mostrar).
  useEffect(() => {
    if (!visible) {
      setIssued(null);
      return;
    }
    void generate();
  }, [visible]);

  // Mientras el código está a la vista se espera la validación de la sede.
  useEffect(() => {
    if (!visible || !issued) return;
    let active = true;
    const timer = setInterval(() => {
      setNow(Date.now());
      void driverOrdersService
        .getOrder(order.id)
        .then((raw) => {
          if (active && raw?.status === doneStatus) onDoneRef.current(mapBackendOrderToDomain(raw));
        })
        .catch(() => {
          // Sin señal momentánea: se vuelve a consultar en el siguiente intervalo.
        });
    }, HANDOFF_POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [visible, issued, order.id, doneStatus]);

  const left = issued ? minutesLeft(issued.expiresAt, now) : 0;
  const expired = !!issued && left === 0;

  return (
    <BottomSheet title={title} visible={visible} onClose={onClose}>
      <View style={styles.box}>
        <Body muted>{description}</Body>
        {a.feedback}
        {issued && !expired ? (
          <View testID="driver_handoff_code" style={styles.box}>
            <View style={styles.qr}>
              <QRCode value={`${QR_PREFIX}:${order.id}:${type}:${issued.qrToken}`} size={180} />
            </View>
            <Text
              accessibilityLabel={`Código ${issued.code.split("").join(" ")}`}
              style={styles.code}
            >
              {issued.code.slice(0, 3)} {issued.code.slice(3)}
            </Text>
            <Body muted>
              {left === 1 ? "Vence en 1 minuto." : `Vence en ${left} minutos.`} Esperando la
              validación de la sede...
            </Body>
          </View>
        ) : expired ? (
          <Body>El código venció. Genera uno nuevo.</Body>
        ) : null}
        <Button
          label="Generar otro código"
          secondary
          icon="refresh-outline"
          busy={a.busy}
          onPress={() => void generate()}
        />
        <Button label="Cerrar" secondary onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  box: { gap: 12, alignItems: "stretch" },
  qr: {
    alignSelf: "center",
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  code: {
    textAlign: "center",
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: 4,
    color: "#0F172A",
    fontVariant: ["tabular-nums"],
  },
});
