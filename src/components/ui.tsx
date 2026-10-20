import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme as chromeTheme } from "../design-system/tokens";
import { contentTheme as theme, contentColors } from "../design-system/classic";
import { tactile, friendlyError } from "../design-system/interaction";
import { useFeedback } from "./overlay/OverlayContext";
export const colors = chromeTheme.colors;
export { contentColors };
export const ui = StyleSheet.create({
  card: {
    backgroundColor: contentColors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.subtle,
    gap: theme.spacing.sm,
    borderColor: contentColors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flexWrap: "wrap",
  },
  chromeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: chromeTheme.spacing.sm,
    flexWrap: "wrap",
  },
  chromeSubtitle: { color: colors.dark, ...chromeTheme.typography.section },
  title: { color: "#111827", ...theme.typography.title },
  subtitle: { color: "#111827", ...theme.typography.section },
  text: { color: contentColors.text, ...theme.typography.body },
  muted: { color: contentColors.muted, ...theme.typography.secondary },
  input: {
    borderWidth: 1,
    borderColor: contentColors.border,
    backgroundColor: contentColors.surface,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: contentColors.text,
    minHeight: theme.layout.button,
    fontSize: 16,
  },
  action: {
    backgroundColor: contentColors.primary,
    borderRadius: theme.radius.md,
    minHeight: theme.layout.button,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  outline: {
    backgroundColor: contentColors.surface,
    borderWidth: 1,
    borderColor: contentColors.border,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.pill,
    backgroundColor: contentColors.soft,
    paddingVertical: 5,
    paddingHorizontal: 9,
    color: contentColors.primary,
    ...theme.typography.caption,
    fontWeight: "600",
  },
  error: {
    color: contentColors.danger,
    backgroundColor: contentColors.dangerSoft,
    padding: 12,
    borderRadius: theme.radius.md,
    ...theme.typography.secondary,
  },
});
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  size = 22,
  color = colors.primary,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[ui.card, style]}>{children}</View>;
}
export function Title({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text accessibilityRole="header" style={[ui.subtitle, style]}>
      {children}
    </Text>
  );
}
export function Body({
  children,
  muted = false,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[muted ? ui.muted : ui.text, style]}>{children}</Text>;
}
export function Badge({ children }: { children: React.ReactNode }) {
  return <Text style={ui.badge}>{children}</Text>;
}
export function Button({
  label,
  onPress,
  icon,
  secondary = false,
  disabled = false,
  busy = false,
  testID,
  variant,
  style,
  textStyle,
}: {
  label: string;
  onPress(): void;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  testID?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const kind = variant ?? (secondary ? "secondary" : "primary");
  const soft = kind === "secondary" || kind === "ghost";
  const ink = soft ? contentColors.primary : contentColors.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || busy, busy }}
      testID={testID}
      onPress={() => {
        tactile("selection");
        onPress();
      }}
      disabled={disabled || busy}
      style={({ pressed }) => [
        ui.action,
        soft && {
          backgroundColor:
            kind === "ghost"
              ? contentColors.transparent
              : contentColors.surface,
        },
        kind === "secondary" && ui.outline,
        kind === "danger" && { backgroundColor: contentColors.danger },
        {
          opacity:
            disabled || busy
              ? theme.opacity.disabled
              : pressed
                ? theme.opacity.pressed
                : 1,
        },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={ink} />
      ) : (
        icon && <Icon name={icon} color={ink} size={19} />
      )}
      <Text
        style={[
          {
            color: ink,
            ...theme.typography.button,
            textAlign: "center",
            flexShrink: 1,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  label,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: IconName;
  onPress(): void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        tactile("selection");
        onPress();
      }}
      style={({ pressed }) => ({
        minWidth: theme.layout.touch,
        minHeight: theme.layout.touch,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.radius.md,
        opacity: disabled
          ? theme.opacity.disabled
          : pressed
            ? theme.opacity.pressed
            : 1,
        backgroundColor: pressed ? colors.soft : colors.transparent,
      })}
    >
      <Icon name={icon} />
    </Pressable>
  );
}
export function Field({
  label,
  labelStyle,
  leadingIcon,
  labelAccessory,
  help,
  error,
  validate,
  onBlur,
  onFocus,
  onChangeText,
  ...props
}: TextInputProps & {
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  leadingIcon?: IconName;
  labelAccessory?: React.ReactNode;
  help?: string;
  error?: string;
  validate?: (value: string) => string | undefined;
}) {
  const [focused, setFocused] = useState(false),
    [touched, setTouched] = useState(false),
    [reveal, setReveal] = useState(false);
  const automatic = (value: string): string | undefined => {
    if (
      /correo/i.test(label) &&
      value &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    )
      return "Revisa el formato del correo.";
    if (
      /contraseña nueva|nueva contraseña/i.test(label) &&
      !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value)
    )
      return "Usa 8 caracteres, una mayúscula y un número.";
    return undefined;
  };
  const problem =
    error ||
    (touched ? (validate ?? automatic)(String(props.value ?? "")) : undefined);
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}
      >
        <Text
          style={[
            ui.muted,
            {
              fontWeight: "600",
              color: contentColors.text,
            },
            labelStyle,
            problem && { color: contentColors.danger },
          ]}
        >
          {label}
        </Text>
        {labelAccessory}
      </View>
      <View style={{ position: "relative" }}>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={problem || help}
          placeholderTextColor={contentColors.muted}
          {...props}
          secureTextEntry={props.secureTextEntry && !reveal}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            setTouched(true);
            onBlur?.(e);
          }}
          onChangeText={onChangeText}
          style={[
            ui.input,
            leadingIcon && { paddingLeft: 40 },
            props.secureTextEntry && { paddingRight: 58 },
            focused && { borderColor: contentColors.focus, borderWidth: 2 },
            problem && { borderColor: contentColors.danger },
            props.editable === false && { backgroundColor: contentColors.soft },
            props.style,
          ]}
        />
        {leadingIcon && (
          <View pointerEvents="none" style={{ position: "absolute", left: 12, top: 17 }}>
            <Icon name={leadingIcon} size={18} color={contentColors.muted} />
          </View>
        )}
        {props.secureTextEntry && (
          <View style={{ position: "absolute", right: 2, top: 2 }}>
            <IconButton
              label={
                (reveal ? "Ocultar " : "Mostrar ") + label.toLocaleLowerCase()
              }
              icon={reveal ? "eye-off-outline" : "eye-outline"}
              onPress={() => setReveal(!reveal)}
            />
          </View>
        )}
      </View>
      {(problem || help) && (
        <Text
          accessibilityRole={problem ? "alert" : undefined}
          style={[ui.muted, problem && { color: contentColors.danger }]}
        >
          {problem || help}
        </Text>
      )}
    </View>
  );
}
export function Choice({
  label,
  selected,
  onPress,
  disabled = false,
  style,
  textStyle,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      aria-checked={selected}
      disabled={disabled}
      onPress={() => {
        tactile("selection");
        onPress();
      }}
      style={({ pressed }) => [
        ui.action,
        ui.outline,
        { justifyContent: "flex-start" },
        selected && {
          backgroundColor: contentColors.soft,
          borderColor: contentColors.primary,
        },
        {
          opacity: disabled
            ? theme.opacity.disabled
            : pressed
              ? theme.opacity.pressed
              : 1,
        },
        style,
      ]}
    >
      <Icon
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={20}
      />
      <Text style={[ui.text, { flexShrink: 1 }, textStyle]}>{label}</Text>
    </Pressable>
  );
}
export function Check({
  label,
  checked,
  onChange,
  children,
  style,
}: {
  label: string;
  checked: boolean;
  onChange(value: boolean): void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      aria-checked={checked}
      onPress={() => {
        tactile("selection");
        onChange(!checked);
      }}
      style={[ui.row, { minHeight: theme.layout.touch }, style]}
    >
      {children ?? (
        <>
          <Icon name={checked ? "checkbox" : "square-outline"} />
          <Text style={[ui.text, { flex: 1 }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
export function Empty({
  text,
  title = "Todavía no hay resultados",
  action,
}: {
  text: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 32 }}>
      <Icon name="file-tray-outline" size={32} />
      <Title>{title}</Title>
      <Body muted>{text}</Body>
      {action}
    </Card>
  );
}
export function useAction() {
  const notify = useFeedback();
  const [message, setMessage] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const succeeded = (success?: string) => {
    if (success) {
      tactile("success");
      if (notify) notify(success, "success");
      else setMessage(success);
    }
  };
  const failed = (e: unknown) => {
    setError(friendlyError(e));
    tactile("error");
  };
  const run = (action: () => unknown, success?: string): boolean => {
    if (locked.current) return false;
    locked.current = true;
    setError(null);
    setMessage(null);
    try {
      action();
      succeeded(success);
      return true;
    } catch (e) {
      failed(e);
      return false;
    } finally {
      locked.current = false;
    }
  };
  const asyncRun = async (
    action: () => Promise<unknown>,
    success?: string,
  ): Promise<boolean> => {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      succeeded(success);
      return true;
    } catch (e) {
      failed(e);
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const feedback = (
    <>
      {error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      {message && (
        <Text
          accessibilityLiveRegion="polite"
          style={[ui.badge, { color: contentColors.success }]}
        >
          {message}
        </Text>
      )}
    </>
  );
  return { run, asyncRun, feedback, busy };
}
