import { FullScreenOverlay } from "./overlay/OverlayPortal";
import { useRef, useState } from "react";
import { View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Body, Button, Card, useAction } from "./ui";
export function QrScanner({ onScan }: { onScan(code: string): void }) {
  const [open, setOpen] = useState(false);
  const scanned = useRef(false);
  const [permission, request] = useCameraPermissions();
  const a = useAction();
  return (
    <>
      {a.feedback}
      <Button
        label="Escanear QR de transferencia"
        secondary
        icon="qr-code-outline"
        busy={a.busy}
        onPress={() => {
          void a.asyncRun(async () => {
            const p = permission?.granted ? permission : await request();
            if (!p.granted)
              throw Error(
                "Permite acceso a la cámara o ingresa el código manual.",
              );
            scanned.current = false;
            setOpen(true);
          });
        }}
      />
      <FullScreenOverlay
        title="Escanear transferencia"
        visible={open}
        onClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            padding: 20,
            backgroundColor: "#F8FAFC",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <Card>
            <Body>Enfoca el QR de esta solicitud.</Body>
          </Card>
          {open && permission?.granted && (
            <CameraView
              style={{ height: 340, width: "100%" }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={(result) => {
                if (scanned.current) return;
                scanned.current = true;
                setOpen(false);
                onScan(result.data);
              }}
            />
          )}
          <Button label="Cerrar cámara" onPress={() => setOpen(false)} />
        </View>
      </FullScreenOverlay>
    </>
  );
}
