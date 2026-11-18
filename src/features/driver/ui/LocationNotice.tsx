import { View } from "react-native";
import { Body, Button, Card, Title } from "../../../components/ui";
import {
  useLiveLocation,
  type LocationStatus,
} from "../model/LiveLocationContext";

// Sin ubicación real administración no puede asignarle solicitudes al chofer: se le explica por
// qué y cómo activarla. No se muestra nada mientras la ubicación se envía con normalidad.
const COPY: Partial<
  Record<LocationStatus, { title: string; body: string; action: string }>
> = {
  denied: {
    title: "Activa tu ubicación",
    body: "Sin acceso a tu ubicación, administración no puede asignarte recogidas ni entregas.",
    action: "Permitir ubicación",
  },
  blocked: {
    title: "Ubicación bloqueada",
    body: "El permiso de ubicación está desactivado para esta app. Actívalo en los ajustes del teléfono para recibir asignaciones.",
    action: "Abrir ajustes",
  },
  disabled: {
    title: "La ubicación del teléfono está apagada",
    body: "Enciéndela para que administración pueda asignarte recogidas y entregas.",
    action: "Reintentar",
  },
  error: {
    title: "No se pudo obtener tu ubicación",
    body: "Revisa que el GPS esté encendido y vuelve a intentarlo.",
    action: "Reintentar",
  },
};

export function LocationNotice() {
  const { status, activate } = useLiveLocation();
  if (status === "requesting")
    return (
      <View testID="location_notice" accessibilityLiveRegion="polite">
        <Body muted>Obteniendo tu ubicación...</Body>
      </View>
    );
  const copy = COPY[status];
  if (!copy) return null;
  return (
    <Card
      style={{ borderColor: "#FCD34D", backgroundColor: "#FFFBEB", gap: 8 }}
    >
      <View
        testID="location_notice"
        accessibilityRole="alert"
        style={{ gap: 4 }}
      >
        <Title>{copy.title}</Title>
        <Body>{copy.body}</Body>
      </View>
      <Button label={copy.action} onPress={() => void activate()} />
    </Card>
  );
}
