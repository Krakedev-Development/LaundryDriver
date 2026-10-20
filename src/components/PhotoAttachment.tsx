import { useState } from "react";
import { View } from "react-native";
import { Body, Button, Icon, ui, useAction } from "./ui";
import { BottomSheet } from "./overlay/OverlayPortal";
import { pickPhoto } from "../services/media";
export function PhotoAttachment({
  label,
  uri,
  onChange,
  selfie = false,
}: {
  label: string;
  uri?: string;
  onChange(uri: string): void;
  selfie?: boolean;
}) {
  const action = useAction(),
    [open, setOpen] = useState(false);
  const select = (source: "camera" | "library") => {
    setOpen(false);
    requestAnimationFrame(() => {
      void action.asyncRun(async () => {
        const selected = await pickPhoto(source, selfie);
        if (selected) onChange(selected);
      });
    });
  };
  return (
    <View style={{ gap: 10 }}>
      <View style={ui.row}>
        <Icon name={uri ? "checkmark-circle-outline" : "camera-outline"} />
        <Body>{uri ? label + ": archivo adjunto" : label}</Body>
      </View>
      {action.feedback}
      <Button
        label={
          uri
            ? "Cambiar " + label.toLocaleLowerCase()
            : "Adjuntar " + label.toLocaleLowerCase()
        }
        icon="camera-outline"
        secondary
        busy={action.busy}
        onPress={() => setOpen(true)}
      />
      <BottomSheet
        title="Adjuntar imagen"
        visible={open}
        onClose={() => setOpen(false)}
      >
        <Body muted>Usa una foto real y legible.</Body>
        <Button
          label={selfie ? "Tomar selfie" : "Tomar foto"}
          icon="camera-outline"
          secondary
          onPress={() => select("camera")}
        />
        <Button
          label="Elegir imagen del dispositivo"
          icon="image-outline"
          secondary
          onPress={() => select("library")}
        />
      </BottomSheet>
    </View>
  );
}
