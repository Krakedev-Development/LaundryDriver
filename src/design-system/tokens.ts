const brand = {
  primary: "#143F73",
  dark: "#0F315A",
  lime: "#A5CD39",
  aqua: "#61BFC7",
};
export const lightColors = {
  ...brand,
  background: "#F5F7FA",
  surface: "#FFFFFF",
  soft: "#EDF2F7",
  border: "#DFE6EE",
  divider: "#E9EEF4",
  text: "#162B43",
  muted: "#52647A",
  disabled: "#718096",
  danger: "#A92336",
  dangerSoft: "#FFF0F2",
  success: "#116448",
  successSoft: "#EAF6EF",
  warning: "#87500D",
  warningSoft: "#FFF5DE",
  info: "#245D87",
  infoSoft: "#EBF3FB",
  overlay: "#10253D66",
  onPrimary: "#FFFFFF",
  skeleton: "#E2E8EF",
  focus: "#286EB2",
  transparent: "transparent",
};
export type Palette = { [K in keyof typeof lightColors]: string };
export const darkColors: Palette = {
  ...brand,
  primary: "#A7C9F2",
  dark: "#D6E6F8",
  background: "#101A28",
  surface: "#182637",
  soft: "#223448",
  border: "#35485C",
  divider: "#293C50",
  text: "#EEF4FB",
  muted: "#B2C1D2",
  disabled: "#8A9BAE",
  danger: "#FFABBA",
  dangerSoft: "#452330",
  success: "#8FD6B4",
  successSoft: "#15392D",
  warning: "#F0C585",
  warningSoft: "#40341D",
  info: "#B0D5F3",
  infoSoft: "#20364B",
  overlay: "#020912B3",
  onPrimary: "#10243D",
  skeleton: "#2B3D51",
  focus: "#A7C9F2",
  transparent: "transparent",
};
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 40,
  screen: 20,
};
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };
export const typography = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: "800" as const },
  title: { fontSize: 24, lineHeight: 31, fontWeight: "800" as const },
  section: { fontSize: 18, lineHeight: 25, fontWeight: "700" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  secondary: { fontSize: 14, lineHeight: 21, fontWeight: "400" as const },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: "500" as const },
  button: { fontSize: 15, lineHeight: 22, fontWeight: "700" as const },
};
export const motion = {
  fast: 140,
  normal: 220,
  screen: 280,
  sheet: 300,
  search: 250,
  toast: 6000,
};
export const opacity = { disabled: 0.55, pressed: 0.8 };
export const layout = {
  touch: 48,
  button: 52,
  maxWidth: 780,
  sheetMaxWidth: 600,
  drawerMaxWidth: 340,
  logoWidth: 136,
  logoHeight: 35,
  map: 320,
  mapCompact: 260,
  qr: 168,
};
export const shadow = {
  subtle: {
    shadowColor: "#10253D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1,
  },
};
export const zIndex = { content: 0, feedback: 10, overlay: 20 };
export const theme = {
  colors: lightColors,
  spacing,
  radius,
  typography,
  motion,
  opacity,
  layout,
  shadow,
  zIndex,
};
export const darkTheme = { ...theme, colors: darkColors };
