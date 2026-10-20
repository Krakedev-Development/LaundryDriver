import { Image, StyleSheet, View } from "react-native";
import { contentTheme as theme } from "../design-system/classic";

/** Reference login presentation using the official Laundry assets. */
export function LoginBrand() {
  return (
    <View style={loginStyles.brand}>
      <Image
        source={require("../../assets/logo-laundry-lav.png")}
        resizeMode="contain"
        accessible={false}
        style={loginStyles.brandMark}
      />
      <Image
        source={require("../../assets/logo-laundry-name.png")}
        resizeMode="contain"
        accessible={false}
        style={loginStyles.logo}
      />
    </View>
  );
}

export const loginStyles = StyleSheet.create({
  page: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 12,
    paddingBottom: 24,
    gap: 0,
  },
  content: { width: "100%", maxWidth: 420, alignSelf: "center" },
  brand: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 24 },
  brandMark: { width: 40, height: 56 },
  logo: { width: 180, height: 56 },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: "#052B50",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: 18, paddingHorizontal: 20 },
  form: {
    padding: 14,
    gap: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    shadowOpacity: 0.08,
    elevation: 2,
  },
  input: { backgroundColor: "#EEF3FF", borderRadius: 12, fontSize: 14 },
  required: { fontSize: 11, color: theme.colors.muted },
  submit: { borderRadius: 12, paddingVertical: 14, backgroundColor: "#052B50", flexDirection: "row-reverse" },
  forgot: { paddingHorizontal: 0, paddingVertical: 0, minHeight: 48, flexShrink: 1 },
  forgotText: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  register: { paddingHorizontal: 0, minHeight: 48 },
  registerText: { fontSize: 14, lineHeight: 20, fontWeight: "700", color: "#052B50" },
  divider: { height: 1, backgroundColor: "#E1E7F2", marginTop: 4, marginBottom: 14 },
  registration: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 },
  accountNotice: { fontSize: 14, lineHeight: 20, color: "#052B50", textAlign: "center", paddingHorizontal: 8, marginTop: 4, marginBottom: 12 },
  registrationPrompt: { fontSize: 14, color: "#052B50" },
  footer: { gap: 6, alignItems: "center", marginTop: 12 },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  footerText: { fontSize: 11, lineHeight: 16, color: theme.colors.muted, textAlign: "center", flexShrink: 1 },
  demo: { marginTop: 24, gap: 8 },
  demoTitle: { fontSize: 12, fontWeight: "600", color: theme.colors.muted, textAlign: "center" },
  demoRow: { flexDirection: "row", gap: 10 },
  demoButton: { flex: 1, borderRadius: 12 },
});
