import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Body, Button, Icon, contentColors, useAction } from "./ui";
import { BottomSheet, FullScreenOverlay } from "./overlay/OverlayPortal";
import { pickPhoto } from "../services/media";
import { tactile } from "../design-system/interaction";

export function PhotoAttachment({
  label,
  uri,
  onChange,
  selfie = false,
  required = false,
}: {
  label: string;
  uri?: string;
  onChange(uri: string): void;
  selfie?: boolean;
  required?: boolean;
}) {
  const action = useAction(),
    [open, setOpen] = useState(false),
    [previewOpen, setPreviewOpen] = useState(false);

  const select = (source: "camera" | "library") => {
    setOpen(false);
    requestAnimationFrame(() => {
      void action.asyncRun(async () => {
        const selected = await pickPhoto(source, selfie);
        if (selected) {
          tactile("success");
          onChange(selected);
        }
      });
    });
  };

  const hasPhoto = Boolean(uri);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconSlot,
              hasPhoto ? styles.iconSlotSuccess : styles.iconSlotPending,
            ]}
          >
            <Icon
              name={hasPhoto ? "checkmark-circle" : "camera-outline"}
              size={18}
              color={hasPhoto ? contentColors.success : contentColors.primary}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Body style={styles.labelTitle}>
              {hasPhoto ? label + ": archivo adjunto" : label}
            </Body>
            <Text style={styles.subCaption}>
              {hasPhoto
                ? "Toca la miniatura para ampliar o verificar nitidez"
                : "Captura fotográfica de respaldo operativo"}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.reqBadge,
            hasPhoto
              ? styles.reqBadgeDone
              : required
                ? styles.reqBadgeMandatory
                : styles.reqBadgeOptional,
          ]}
        >
          <Text
            style={[
              styles.reqBadgeText,
              {
                color: hasPhoto
                  ? contentColors.success
                  : required
                    ? contentColors.warning
                    : contentColors.primary,
              },
            ]}
          >
            {hasPhoto ? "VERIFICADA" : required ? "REQUERIDA" : "EVIDENCIA"}
          </Text>
        </View>
      </View>

      {hasPhoto && uri ? (
        <View style={styles.previewRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ampliar miniatura de ${label}`}
            onPress={() => {
              tactile("selection");
              setPreviewOpen(true);
            }}
            style={({ pressed }) => [
              styles.thumbnailWrap,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Image
              source={{ uri }}
              accessible={false}
              style={styles.thumbnail}
            />
            <View style={styles.expandBadge}>
              <Icon name="expand-outline" size={13} color="#FFFFFF" />
            </View>
          </Pressable>
          <View style={styles.previewActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Retomar ${label.toLocaleLowerCase()}`}
              onPress={() => {
                tactile("light");
                setOpen(true);
              }}
              style={({ pressed }) => [
                styles.miniActionBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Icon
                name="refresh-outline"
                size={15}
                color={contentColors.primary}
              />
              <Text style={styles.miniActionText}>Retomar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Eliminar ${label.toLocaleLowerCase()}`}
              onPress={() => {
                tactile("warning");
                onChange("");
              }}
              style={({ pressed }) => [
                styles.miniActionBtn,
                styles.miniActionDanger,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Icon
                name="trash-outline"
                size={15}
                color={contentColors.danger}
              />
              <Text
                style={[
                  styles.miniActionText,
                  { color: contentColors.danger },
                ]}
              >
                Eliminar
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {action.feedback}
      <Button
        label={
          hasPhoto
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

      <FullScreenOverlay
        title={label}
        visible={previewOpen}
        onClose={() => setPreviewOpen(false)}
      >
        <View style={styles.fullPreviewContainer}>
          {uri ? (
            <Image
              source={{ uri }}
              resizeMode="contain"
              style={styles.fullImage}
            />
          ) : null}
          <View style={styles.fullPreviewFooter}>
            <Button
              label="Retomar captura"
              secondary
              icon="camera-outline"
              onPress={() => {
                tactile("light");
                setPreviewOpen(false);
                setOpen(true);
              }}
            />
            <Button
              label="Cerrar vista previa"
              onPress={() => setPreviewOpen(false)}
            />
          </View>
        </View>
      </FullScreenOverlay>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D6DFEA",
    backgroundColor: "#F8FAFC",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconSlot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconSlotPending: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  iconSlotSuccess: {
    backgroundColor: contentColors.successSoft,
    borderColor: "#A7F3D0",
  },
  labelTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: contentColors.text,
  },
  subCaption: {
    fontSize: 11,
    lineHeight: 15,
    color: contentColors.muted,
  },
  reqBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  reqBadgeOptional: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  reqBadgeMandatory: {
    backgroundColor: contentColors.warningSoft,
    borderColor: "#FDE68A",
  },
  reqBadgeDone: {
    backgroundColor: contentColors.successSoft,
    borderColor: "#A7F3D0",
  },
  reqBadgeText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 2,
  },
  thumbnailWrap: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: contentColors.primary,
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  expandBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewActions: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  miniActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: contentColors.border,
    backgroundColor: "#FFFFFF",
  },
  miniActionDanger: {
    borderColor: "#FECACA",
    backgroundColor: contentColors.dangerSoft,
  },
  miniActionText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: contentColors.primary,
  },
  fullPreviewContainer: {
    flex: 1,
    gap: 16,
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  fullImage: {
    width: "100%",
    height: 360,
    borderRadius: 14,
    backgroundColor: "#0F172A",
  },
  fullPreviewFooter: {
    gap: 10,
  },
});
