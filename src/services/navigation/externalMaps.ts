import { Alert, Linking } from "react-native";
import {
  buildGoogleMapsDirectionsUrl,
  buildWazeDirectionsUrl,
} from "./externalMapsUrls";

export {
  buildGoogleMapsDirectionsUrl,
  buildWazeDirectionsUrl,
  GUAYAQUIL_FALLBACK,
  resolveOrderNavigationTarget,
  type NavigationTarget,
} from "./externalMapsUrls";

async function openExternalNavigationUrl(
  url: string,
  appName: string,
): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(
        `No se pudo abrir ${appName}`,
        "Verifica que tengas la aplicacion o un navegador web instalado en tu dispositivo.",
      );
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert(
      `No se pudo abrir ${appName}`,
      "Ocurrio un problema al iniciar la navegacion externa. Intenta nuevamente o revisa la direccion.",
    );
    return false;
  }
}

export async function openGoogleMapsDirections(
  latitude: number,
  longitude: number,
): Promise<boolean> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    Alert.alert(
      "Coordenadas no disponibles",
      "Esta parada no cuenta con coordenadas validas para abrir Google Maps.",
    );
    return false;
  }
  return openExternalNavigationUrl(
    buildGoogleMapsDirectionsUrl(latitude, longitude),
    "Google Maps",
  );
}

export async function openWazeDirections(
  latitude: number,
  longitude: number,
): Promise<boolean> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    Alert.alert(
      "Coordenadas no disponibles",
      "Esta parada no cuenta con coordenadas validas para abrir Waze.",
    );
    return false;
  }
  return openExternalNavigationUrl(
    buildWazeDirectionsUrl(latitude, longitude),
    "Waze",
  );
}
