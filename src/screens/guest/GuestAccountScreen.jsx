import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Screen } from "@/components";
import { APP_NAME } from "@/constants/config";
import { Routes } from "@/constants/routes";
import { colors } from "@/constants/colors";
import { radius, spacing, typography } from "@/constants/sizes";
import { openAuthentication } from "@/utils/authAccess";
import { useNavigation } from "@react-navigation/native";

export default function GuestAccountScreen() {
  const navigation = useNavigation();

  return (
    <Screen>
      <View style={styles.content}>
        <Image
          source={require("@/assets/icon.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <Text style={styles.title}>Your marketplace account</Text>
        <Text style={styles.body}>
          Sign in to manage your profile, plans, saved services and project
          activity. You can continue exploring the marketplace without an
          account.
        </Text>

        <View style={styles.features}>
          {[
            ["briefcase-outline", "Manage your services"],
            ["credit-card-outline", "Access plans and subscriptions"],
            ["account-group-outline", "Connect with businesses"],
          ].map(([icon, label]) => (
            <View key={label} style={styles.feature}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons
                  name={icon}
                  size={19}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.featureText}>{label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => openAuthentication(navigation)}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Sign in</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
        <Pressable
          onPress={() => openAuthentication(navigation, Routes.Register)}
          accessibilityRole="button"
          accessibilityLabel="Create an account"
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Create an account</Text>
        </Pressable>
        <Text style={styles.brand}>{APP_NAME}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  logo: {
    width: 72,
    height: 72,
    alignSelf: "center",
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: "center",
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  features: { gap: spacing.sm, marginVertical: spacing.xl },
  feature: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  featureText: { ...typography.bodyBold, color: colors.text },
  primaryButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { ...typography.bodyBold, color: "#FFFFFF" },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: { ...typography.bodyBold, color: colors.primary },
  brand: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.xl,
  },
  pressed: { opacity: 0.8 },
});
