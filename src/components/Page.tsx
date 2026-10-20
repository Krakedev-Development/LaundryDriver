import React, { useEffect, useRef } from "react";
import {
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useNavigationState,
  useRoute,
} from "@react-navigation/native";
import { useApp } from "../store/AppProvider";
import { titles, type Routes } from "../navigation/routes";
import { Button, colors, IconButton, ui } from "./ui";
import { NavigationBar } from "./NavigationBar";
import {
  driverTabs,
  primaryTabTarget,
  type Tab,
} from "../navigation/primaryTabs";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";
import { theme } from "../design-system/tokens";
import { contentTheme } from "../design-system/classic";
import { friendlyError } from "../design-system/interaction";
const fullScreen = [
  "Chat",
  "DriverMap",
  "DriverPickupConfirm",
  "DriverDeliveryConfirm",
  "DriverChangePassword",
];
export function Logo() {
  return (
    <Image
      source={require("../../assets/logo-laundry-name.png")}
      accessibilityLabel="Laundry Clean & Fresh"
      resizeMode="contain"
      style={{ width: theme.layout.logoWidth, height: theme.layout.logoHeight }}
    />
  );
}
export function Page({
  children,
  scroll = true,
  footer,
  scrollResetKey,
  onBack,
  backgroundColor,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  footer?: React.ReactNode;
  scrollResetKey?: string | number;
  onBack?(): void;
  backgroundColor?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const { state, error, retry } = useApp();
  const navigation = useLaundryNavigation(),
    route = useRoute();
  const name = route.name as keyof Routes;
  const scrollRef = useRef<ScrollView>(null);

  const tabs = driverTabs,
    primary = primaryTabTarget(name);
  const activeTab = useNavigationState((s) => {
    if (s.type === "tab") return s.routes[s.index].name;
    const nested = s.routes.find((r) => r.name === "DriverTabs")?.state;
    return nested?.routes[nested.index ?? 0]?.name ?? "DriverRoute";
  });
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [scrollResetKey]);
  useFocusEffect(
    React.useCallback(() => {
      if (!onBack) return;
      const listener = BackHandler.addEventListener("hardwareBackPress", () => {
        onBack();
        return true;
      });
      return () => listener.remove();
    }, [onBack]),
  );
  const authenticated = !!state.session && !state.driver.mustChangePassword;
  const navigate = (target: Tab["route"]) => navigation.navigate(target);
  const back = () =>
    onBack
      ? onBack()
      : navigation.canGoBack()
        ? navigation.goBack()
        : navigate("DriverRoute");
  const showTabs = authenticated && !primary && !fullScreen.includes(name);
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: backgroundColor ?? colors.background }}
      edges={primary ? ["top"] : ["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {name !== "Login" && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderBottomColor: colors.divider,
              borderBottomWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <View
              style={[
                ui.chromeRow,
                { justifyContent: "space-between", flexWrap: "nowrap" },
              ]}
            >
              {primary || !navigation.canGoBack() ? (
                <View
                  style={{
                    width: theme.layout.touch,
                    height: authenticated ? theme.layout.touch : undefined,
                  }}
                />
              ) : (
                <IconButton label="Atrás" icon="arrow-back" onPress={back} />
              )}
              {primary || !authenticated ? (
                <Logo />
              ) : (
                <Text
                  accessibilityRole="header"
                  numberOfLines={2}
                  style={[ui.chromeSubtitle, { flex: 1, marginHorizontal: 8 }]}
                >
                  {titles[name]}
                </Text>
              )}
              <View style={{ width: 48 }} />
            </View>
          </View>
        )}
        {error && (
          <View style={{ padding: 12 }}>
            <Text accessibilityRole="alert" style={ui.error}>
              {friendlyError(error)}
            </Text>
            <Button label="Reintentar guardado" secondary onPress={retry} />
          </View>
        )}
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            style={{
              flex: 1,
              backgroundColor:
                backgroundColor ?? contentTheme.colors.background,
            }}
            contentContainerStyle={[
              {
                padding: contentTheme.spacing.screen,
                backgroundColor:
                  backgroundColor ?? contentTheme.colors.background,
                gap: 16,
                paddingBottom: 28,
                width: "100%",
                maxWidth: theme.layout.maxWidth,
                alignSelf: "center",
              },
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              {
                flex: 1,
                padding: contentTheme.spacing.screen,
                backgroundColor:
                  backgroundColor ?? contentTheme.colors.background,
                gap: 16,
                width: "100%",
                maxWidth: theme.layout.maxWidth,
                alignSelf: "center",
              },
              contentContainerStyle,
            ]}
          >
            {children}
          </View>
        )}
        {footer && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
              padding: 12,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: theme.layout.maxWidth,
                alignSelf: "center",
                gap: 6,
              }}
            >
              {footer}
            </View>
          </View>
        )}
        {showTabs && (
          <NavigationBar
            tabs={tabs}
            activeRoute={activeTab}
            onSelect={navigate}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
