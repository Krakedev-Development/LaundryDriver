import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { contentTheme as theme } from "../../design-system/classic";
import { Body, Card, Title } from "../ui";

export function ProfileHero({
  title,
  email,
  children,
}: {
  title: string;
  email: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={styles.hero}>
      <View style={styles.logoCircle}>
        <Image
          source={require("../../../assets/logo-laundry-lav.png")}
          resizeMode="contain"
          accessible={false}
          style={styles.logo}
        />
      </View>
      <Title style={styles.heroTitle}>{title}</Title>
      <Body muted style={styles.heroEmail}>
        {email}
      </Body>
      {children}
    </Card>
  );
}
const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.soft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  logo: { width: 72, height: 72 },
  heroTitle: { fontSize: 20, lineHeight: 27, textAlign: "center" },
  heroEmail: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: "100%",
  },
});
