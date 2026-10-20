import * as ImagePicker from "expo-image-picker";
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

export async function pickPhoto(
  source: "camera" | "library",
  selfie = false,
): Promise<string | null> {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted)
    throw Error(
      "Permite el acceso en los ajustes del dispositivo para adjuntar una imagen.",
    );
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 0.7,
    cameraType: selfie
      ? ImagePicker.CameraType.front
      : ImagePicker.CameraType.back,
    base64: Platform.OS === "web",
  };
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (Platform.OS === "web")
    return asset.base64
      ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
      : asset.uri;
  const destination = new File(
    Paths.document,
    `laundry-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
  );
  new File(asset.uri).copy(destination);
  return destination.uri;
}
