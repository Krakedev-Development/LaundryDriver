import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  Body,
  contentColors as colors,
  Icon,
  IconButton,
  Title,
  ui,
  type IconName,
} from "./ui";
import { MotionSection } from "../design-system/MotionProvider";
import { contentTheme as theme } from "../design-system/classic";
import { statusLabels, type OrderStatus, type Order } from "../domain/models";
export function Accordion({
  title,
  children,
  initialOpen = false,
  subtitle,
  appearance = "card",
}: {
  title: string;
  children: React.ReactNode;
  initialOpen?: boolean;
  subtitle?: string;
  appearance?: "card" | "list";
}) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <View style={appearance === "list" ? { gap: 0 } : ui.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => setOpen(!open)}
        style={[
          ui.row,
          { minHeight: 48, flexWrap: "nowrap" },
          appearance === "list" && { paddingVertical: 14, paddingHorizontal: 14 },
        ]}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Title
            style={
              appearance === "list"
                ? { fontSize: 15, lineHeight: 21, fontWeight: "600" }
                : undefined
            }
          >
            {title}
          </Title>
          {subtitle && <Body muted>{subtitle}</Body>}
        </View>
        <Icon
          name={open ? "chevron-up" : "chevron-down"}
          size={appearance === "list" ? 18 : 20}
          color={appearance === "list" ? colors.muted : undefined}
        />
      </Pressable>
      {open && (
        <MotionSection>
          <View
            style={[
              { gap: 12 },
              appearance === "list" && {
                paddingHorizontal: 14,
                paddingBottom: 14,
              },
            ]}
          >
            {children}
          </View>
        </MotionSection>
      )}
    </View>
  );
}
export function ListItem({
  title,
  subtitle,
  icon,
  onPress,
  trailing,
  appearance = "list",
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  onPress?(): void;
  trailing?: React.ReactNode;
  appearance?: "list" | "metric";
}) {
  const content =
    appearance === "metric" ? (
      <>
        {icon && <Icon name={icon} size={20} />}
        <Text
          style={{
            fontSize: 16,
            lineHeight: 22,
            fontWeight: "700",
            color: colors.text,
            textAlign: "center",
          }}
        >
          {subtitle}
        </Text>
        <Text
          style={{
            ...theme.typography.caption,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          {title}
        </Text>
      </>
    ) : (
      <>
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: colors.soft,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon && <Icon name={icon} size={21} />}
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[ui.text, { fontWeight: "600" }]}>{title}</Text>
          {subtitle && <Body muted>{subtitle}</Body>}
        </View>
        {trailing || (onPress && <Icon name="chevron-forward" size={18} />)}
      </>
    );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        ui.row,
        {
          minHeight: 64,
          flexWrap: "nowrap",
          paddingVertical: 8,
          opacity: pressed ? 0.8 : 1,
        },
        appearance === "metric" && {
          flex: 1,
          flexDirection: "column",
          gap: 4,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 88,
          paddingVertical: 4,
        },
      ]}
    >
      {content}
    </Pressable>
  ) : (
    <View
      style={[
        ui.row,
        { minHeight: 64, flexWrap: "nowrap", paddingVertical: 8 },
      ]}
    >
      {content}
    </View>
  );
}
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  appearance = "default",
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange(value: T): void;
  appearance?: "default" | "request" | "classic";
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      style={[
        {
          flexDirection: "row",
          padding: appearance === "request" ? 0 : 4,
          gap: appearance === "request" ? 10 : 4,
          borderRadius: 16,
          backgroundColor:
            appearance === "request" ? "transparent" : colors.soft,
        },
        appearance === "classic" && {
          padding: 0,
          gap: 8,
          backgroundColor: "transparent",
        },
      ]}
    >
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="radio"
          accessibilityLabel={o.label}
          accessibilityState={{ checked: value === o.value }}
          aria-checked={value === o.value}
          onPress={() => onChange(o.value)}
          style={[
            {
              flex: 1,
              minHeight: 48,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              padding: appearance === "request" ? 12 : 6,
              borderWidth: appearance === "request" ? 1.5 : 0,
              borderColor: value === o.value ? "#93C5FD" : "#E5E7EB",
              backgroundColor:
                appearance === "request"
                  ? value === o.value
                    ? "#EFF6FF"
                    : "#FFFFFF"
                  : value === o.value
                    ? colors.surface
                    : colors.transparent,
            },
            appearance === "classic" && {
              borderRadius: 8,
              padding: 8,
              borderWidth: 1.2,
              borderColor: value === o.value ? colors.primary : "#E5E7EB",
              backgroundColor: value === o.value ? colors.primary : "#FFFFFF",
            },
          ]}
        >
          <Text
            style={[
              ui.muted,
              {
                color: value === o.value ? colors.primary : colors.muted,
                fontWeight: value === o.value ? "700" : "500",
                textAlign: "center",
                ...(appearance === "request"
                  ? { fontSize: 13, lineHeight: 19 }
                  : {}),
              },
              appearance === "classic" && {
                fontSize: 12,
                lineHeight: 18,
                fontWeight: "600",
                color: value === o.value ? "#FFFFFF" : colors.muted,
              },
            ]}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Buscar",
  appearance = "default",
}: {
  value: string;
  onChange(value: string): void;
  placeholder?: string;
  appearance?: "default" | "classic";
}) {
  return (
    <View
      style={[
        ui.input,
        ui.row,
        { paddingVertical: 0, flexWrap: "nowrap" },
        appearance === "classic" && {
          backgroundColor: "#FFFFFF",
          borderRadius: 10,
          borderWidth: 1.2,
          paddingHorizontal: 12,
        },
      ]}
    >
      <Icon name="search" size={20} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChange}
        style={[
          { flex: 1, minHeight: 50, color: colors.text, fontSize: 16 },
          appearance === "classic" && { fontSize: 14 },
        ]}
        returnKeyType="search"
      />
      {value !== "" && (
        <IconButton
          label="Limpiar búsqueda"
          icon="close"
          onPress={() => onChange("")}
        />
      )}
    </View>
  );
}
export function useSearch(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(
      () => setDebounced(value.trim().toLocaleLowerCase()),
      theme.motion.search,
    );
    return () => clearTimeout(id);
  }, [value]);
  return debounced;
}
export function Stepper({
  step,
  labels,
}: {
  step: number;
  labels: readonly string[];
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={[ui.row, { justifyContent: "space-between" }]}>
        <Title>{labels[step - 1]}</Title>
        <Body muted>
          {step} de {labels.length}
        </Body>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Progreso de solicitud"
        accessibilityValue={{ min: 1, max: labels.length, now: step }}
        style={{ flexDirection: "row", gap: 6 }}
      >
        {labels.map((label, i) => (
          <View
            key={label}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              backgroundColor: i < step ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}
export function StatusChip({ status }: { status: OrderStatus }) {
  const done = ["DELIVERED", "COMPLETED", "CLOSED"].includes(status),
    problem = ["INCIDENT", "CANCELLED"].includes(status);
  const attention = [
    "PAYMENT_PENDING",
    "PRICING_PENDING",
    "CUSTOMER_APPROVAL_PENDING",
    "WEIGHING",
  ].includes(status);
  const tint: Partial<Record<OrderStatus, { ink: string; fill: string }>> = {
    CREATED: { ink: colors.warning, fill: colors.warningSoft },
    AWAITING_INTAKE: { ink: colors.warning, fill: colors.warningSoft },
    PICKUP_PENDING: { ink: colors.warning, fill: colors.warningSoft },
    IN_PROCESS: { ink: theme.accent.purple, fill: theme.accent.purpleSoft },
    QUALITY_CONTROL: {
      ink: theme.accent.purple,
      fill: theme.accent.purpleSoft,
    },
    READY_FOR_DELIVERY: {
      ink: theme.accent.limeInk,
      fill: theme.accent.limeSoft,
    },
    READY_FOR_PICKUP: {
      ink: theme.accent.limeInk,
      fill: theme.accent.limeSoft,
    },
    OUT_FOR_DELIVERY: {
      ink: theme.accent.limeInk,
      fill: theme.accent.limeSoft,
    },
  };
  const foreground =
    tint[status]?.ink ??
    (problem
      ? colors.danger
      : done
        ? theme.accent.complete
        : attention
          ? colors.warning
          : colors.info);
  const backgroundColor =
    tint[status]?.fill ??
    (problem
      ? colors.dangerSoft
      : done
        ? theme.accent.completeSoft
        : attention
          ? colors.warningSoft
          : colors.infoSoft);
  return (
    <MotionSection key={status}>
      <View
        style={[
          ui.row,
          {
            alignSelf: "flex-start",
            backgroundColor,
            borderRadius: theme.radius.pill,
            paddingHorizontal: 10,
            paddingVertical: 3,
            gap: 6,
          },
        ]}
      >
        <Icon
          name={
            problem
              ? "alert-circle-outline"
              : done
                ? "checkmark-circle-outline"
                : attention
                  ? "time-outline"
                  : "ellipse-outline"
          }
          color={foreground}
          size={15}
        />
        <Text
          style={[
            theme.typography.caption,
            { color: foreground, fontWeight: "600" },
          ]}
        >
          {statusLabels[status]}
        </Text>
      </View>
    </MotionSection>
  );
}
export function Timeline({ events }: { events: Order["timeline"] }) {
  return (
    <View style={{ gap: 16 }}>
      {events.map((event, i) => (
        <View
          key={event.status + "-" + i}
          style={[ui.row, { alignItems: "flex-start", flexWrap: "nowrap" }]}
        >
          <View style={{ alignItems: "center", alignSelf: "stretch", gap: 6 }}>
            <Icon
              name={
                event.completed ? "checkmark-circle-outline" : "ellipse-outline"
              }
              color={event.completed ? colors.success : colors.muted}
              size={20}
            />
            {i < events.length - 1 && (
              <View
                style={{
                  width: 1,
                  flex: 1,
                  minHeight: 18,
                  backgroundColor: colors.border,
                }}
              />
            )}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Body>{event.title}</Body>
            {event.description && <Body muted>{event.description}</Body>}
            <Body muted>{event.timestamp}</Body>
          </View>
        </View>
      ))}
    </View>
  );
}
export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View
      accessibilityLabel="Cargando contenido"
      accessibilityState={{ busy: true }}
      style={{ gap: 12, width: "100%" }}
    >
      {Array.from({ length: lines }, (_, i) => (
        <View
          key={i}
          style={{
            height: i === 0 ? 28 : 16,
            width: i === lines - 1 ? "65%" : "100%",
            borderRadius: 8,
            backgroundColor: colors.skeleton,
          }}
        />
      ))}
    </View>
  );
}
