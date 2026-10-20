import { theme, type Palette } from "./tokens";

/** Visual reference: 4fa1bd3. Navigation, motion and layout contracts stay current. */
export const contentColors: Palette = {
  ...theme.colors,
  background: "#F7F9FC",
  soft: "#E8EEF5",
  border: "#D6DFEA",
  divider: "#EEF1F4",
  text: "#1F2937",
  muted: "#6B7280",
  disabled: "#9CA3AF",
  warning: "#92400E",
  warningSoft: "#FEF3C7",
  info: "#143F73",
  infoSoft: "#E8EEF5",
  focus: "#3B82F6",
};

export const contentTheme = {
  ...theme,
  colors: contentColors,
  spacing: { ...theme.spacing, screen: 16, sm: 8 },
  radius: { ...theme.radius, lg: 12 },
  typography: {
    ...theme.typography,
    display: { fontSize: 28, lineHeight: 36, fontWeight: "700" as const },
    title: { fontSize: 22, lineHeight: 29, fontWeight: "700" as const },
    section: { fontSize: 17, lineHeight: 24, fontWeight: "700" as const },
    body: { fontSize: 14, lineHeight: 21, fontWeight: "400" as const },
    secondary: { fontSize: 12, lineHeight: 18, fontWeight: "400" as const },
    caption: { fontSize: 12, lineHeight: 18, fontWeight: "500" as const },
    button: { fontSize: 16, lineHeight: 22, fontWeight: "700" as const },
  },
  shadow: {
    subtle: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
  },
  accent: {
    limeSoft: "#F1F8DF",
    limeInk: "#638021",
    aquaSoft: "#E7F7F9",
    purple: "#7C3AED",
    purpleSoft: "#EDE9FE",
    complete: "#6B7280",
    completeSoft: "#F3F4F6",
  },
};
