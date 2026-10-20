import { Text, View } from "react-native";
import { Button, colors, ui } from "./ui";
import { Skeleton } from "./presentation";

export function BootstrapState({
  error,
  reset,
  retry,
}: {
  error: string | null;
  reset(): void;
  retry(): void;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 16,
      }}
    >
      {error ? (
        <>
          <Text style={ui.error}>{error}</Text>
          <Button label="Reintentar carga" onPress={retry} />
          <Button
            label="Restablecer datos locales demo"
            secondary
            onPress={reset}
          />
        </>
      ) : (
        <>
          <View style={{ width: "80%", maxWidth: 400 }}>
            <Skeleton lines={4} />
          </View>
          <Text style={ui.muted}>Cargando Laundry…</Text>
        </>
      )}
    </View>
  );
}
