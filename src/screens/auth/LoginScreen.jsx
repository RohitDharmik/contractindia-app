import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Button, Input } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { Routes } from "@/constants/routes";
import { colors } from "@/constants/colors";
import { spacing, typography } from "@/constants/sizes";
import { APP_NAME } from "@/constants/config";
import { isEmail } from "@/utils/validators";
export default function LoginScreen() {
  const nav = useNavigation();
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const submit = async () => {
    setError(undefined);
    if (!isEmail(identifier)) return setError("Enter a valid email");
    if (!password) return setError("Enter your password");
    setLoading(true);
    try {
      const { challengeId, mobile, remark } = await signInWithPassword(
        identifier,
        password,
      );
      
      
      const openOtpScreen = () =>
        nav.navigate(Routes.OTP, {
          challengeId,
          mobile,
          email: identifier.trim(),
          activationCode: challengeId,
        });
      // if (remark) {
      Alert.alert("OTP", remark, [
        {
          text: "Copy",
          onPress: async () => {
            try {
              await navigator.clipboard.writeText(String(remark ?? ""));
            } catch (error) {
              console.log("Copy failed:", error);
            }
          },
        },
        {
          text: "Continue",
          onPress: openOtpScreen,
        },
      ]);
      // } else {
      openOtpScreen();
      // }
    } catch (e) {
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroAccent} />
          <View style={styles.logoFrame}>
            <Image
              source={require("@/assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.heroLabel}>
            India construction services marketplace
          </Text>
        </View>

        <View style={styles.formSurface}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to access your workspace.</Text>

          <Input
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={identifier}
            onChangeText={setIdentifier}
            leftIcon={
              <Ionicons
                name="mail-outline"
                size={18}
                color={colors.textMuted}
              />
            }
          />
          <Input
            label="Password"
            placeholder="Your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftIcon={
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={colors.textMuted}
              />
            }
          />
          <Pressable
            onPress={() => nav.navigate(Routes.ForgotPassword)}
            style={{ alignSelf: "flex-end", marginBottom: spacing.sm }}
          >
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Continue"
            onPress={submit}
            loading={loading}
            fullWidth
            icon={
              <Ionicons
                name="arrow-forward-outline"
                size={18}
                color={colors.textInverse}
              />
            }
            style={styles.submitButton}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to ContractsIndia?</Text>
            <Pressable onPress={() => nav.navigate(Routes.Register)}>
              <Text style={[styles.link, { marginLeft: 4 }]}>
                Create an account
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  hero: {
    backgroundColor: colors.primary,
    minHeight: 260,
    paddingTop: spacing.xxxl * 1.5,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    overflow: "hidden",
  },
  heroAccent: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 34,
    borderColor: colors.primaryLight,
    top: -110,
    right: -70,
  },
  logoFrame: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  logo: { width: 62, height: 62 },
  brand: {
    color: colors.textInverse,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  heroLabel: {
    color: "#B4C5DA",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  formSurface: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: -34,
    borderRadius: 18,
    padding: spacing.xl,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  title: { ...typography.h1, color: colors.text, fontSize: 28 },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: 6 },
  link: { ...typography.label, color: colors.primary },
  error: {
    ...typography.small,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  submitButton: { minHeight: 52, borderRadius: 12 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xxl,
  },
  footerText: { ...typography.body, color: colors.textMuted },
});
