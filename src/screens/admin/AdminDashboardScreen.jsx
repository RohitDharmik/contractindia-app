import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Screen, ScreenHeader } from "@/components";
import PressScale from "../../components/PressScale";
import { Routes } from "@/constants/routes";
import { colors } from "@/constants/colors";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const T = {
  brand: colors.primary,
  brandDeep: colors.primaryDark,
  brandSoft: colors.surfaceAlt,
  ink: colors.text,
  muted: colors.textMuted,
  surface: colors.surface,
  canvas: colors.bg,
  slateSoft: colors.surfaceAlt,
  success: colors.success,
  successSoft: "#ECFDF5",
  amber: colors.accentDark,
  amberSoft: "#FFFBEB",
  sky: colors.info,
  skySoft: "#EFF6FF",
  violet: "#7C3AED",
  violetSoft: "#F5F3FF",
};

const SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

/* ------------------------------------------------------------------ */
/* Static configuration                                                */
/* ------------------------------------------------------------------ */

const MODULES = [
  {
    key: "verification",
    label: "User verification",
    body: "Review registration verification requests",
    icon: "shield-check-outline",
    tone: T.brand,
    soft: T.brandSoft,
    route: Routes.AdminUserVerification,
  },
  {
    key: "services",
    label: "Service management",
    body: "Manage the service catalog records",
    icon: "toolbox-outline",
    tone: T.sky,
    soft: T.skySoft,
    route: Routes.ServiceManagement,
  },
  {
    key: "payments",
    label: "Payments",
    body: "Razorpay and Stripe reconciliation",
    icon: "credit-card-check-outline",
    tone: T.success,
    soft: T.successSoft,
    route: Routes.AdminPayments,
  },
  {
    key: "plans",
    label: "Plans & pricing",
    body: "Subscription tiers and pricing",
    icon: "crown-outline",
    tone: T.violet,
    soft: T.violetSoft,
    route: Routes.BusinessPlansScreen,
  },
];

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

function FadeIn({ delay = 0, children, style }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 380,
      delay,
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function SpecIcon({ spec, color, size = 20, style }) {
  return (
    <View style={style}>
      <MaterialCommunityIcons name={spec.icon} size={size} color={color} />
    </View>
  );
}

function OverviewHero() {
  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={[T.brandDeep, T.brand]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.heroGlow} />
      <View style={styles.heroTop}>
        <View style={styles.heroBadge}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#fff" />
          <Text style={styles.heroBadgeText}>ADMIN WORKSPACE</Text>
        </View>
        <MaterialCommunityIcons name="view-dashboard-outline" size={19} color="rgba(255,255,255,0.8)" />
      </View>
      <Text style={styles.heroTitle}>Run your platform</Text>
      <Text style={styles.heroSub}>
        Manage the people, services and payments that keep ContractsIndia moving.
      </Text>
      <View style={styles.heroMeta}>
        <View>
          <Text style={styles.heroMetaValue}>{MODULES.length}</Text>
          <Text style={styles.heroMetaLabel}>management tools</Text>
        </View>
        <View style={styles.heroMetaDivider} />
        <View>
          <Text style={styles.heroMetaValue}>One place</Text>
          <Text style={styles.heroMetaLabel}>for daily operations</Text>
        </View>
      </View>
    </View>
  );
}

function ModuleCard({ module, onPress }) {
  return (
    <PressScale
      onPress={onPress}
      style={styles.moduleWrap}
      contentStyle={styles.module}
      accessibilityLabel={module.label}
    >
      <SpecIcon
        spec={module}
        color={module.tone}
        size={22}
        style={[styles.moduleIcon, { backgroundColor: module.soft }]}
      />
      <View style={styles.moduleText}>
        <Text style={styles.moduleLabel} numberOfLines={2}>
          {module.label}
        </Text>
        <Text style={styles.moduleBody} numberOfLines={2}>
          {module.body}
        </Text>
      </View>
      <View style={styles.moduleArrow}>
        <MaterialCommunityIcons name="chevron-right" size={18} color={T.muted} />
      </View>
    </PressScale>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function AdminDashboardScreen() {
  const nav = useNavigation();

  return (
    <Screen>
      <ScreenHeader
        title="Overview"
        subtitle="Admin workspace"
        showBack
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <OverviewHero />
        </FadeIn>

        <FadeIn delay={80}>
          <View style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionTitle}>Platform management</Text>
              <Text style={styles.sectionSub}>Choose an area to get started</Text>
            </View>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{MODULES.length} tools</Text>
            </View>
          </View>
          <View style={styles.moduleGrid}>
            {MODULES.map((module) => (
              <ModuleCard
                key={module.key}
                module={module}
                onPress={() => nav.navigate(module.route)}
              />
            ))}
          </View>
        </FadeIn>
      </ScrollView>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: T.canvas },
  content: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 40, gap: 8 },

  /* Hero */
  hero: {
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
    marginBottom: 6,
    shadowColor: T.brand,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    top: -70,
    right: -50,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  heroTitle: { color: "#fff", fontSize: 25, fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { color: "rgba(255,255,255,0.76)", fontSize: 13, marginTop: 7, lineHeight: 19 },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.24)",
  },
  heroMetaValue: { color: "#fff", fontSize: 15, fontWeight: "800" },
  heroMetaLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 3 },
  heroMetaDivider: { width: StyleSheet.hairlineWidth, height: 34, backgroundColor: "rgba(255,255,255,0.25)" },

  /* Section */
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: { color: T.ink, fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  sectionSub: { color: T.muted, fontSize: 12, marginTop: 4 },
  sectionCount: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: T.brandSoft,
  },
  sectionCountText: { color: T.brand, fontSize: 11, fontWeight: "800" },

  /* Module shortcuts */
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  moduleWrap: { width: "48.5%", borderRadius: 18, ...SHADOW },
  module: {
    alignItems: "flex-start",
    minHeight: 154,
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.surface,
  },
  moduleIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleText: { flex: 1, width: "100%", minWidth: 0, marginTop: 14 },
  moduleLabel: { color: T.ink, fontSize: 14, fontWeight: "800" },
  moduleBody: { color: T.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  moduleArrow: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.slateSoft,
  },
});