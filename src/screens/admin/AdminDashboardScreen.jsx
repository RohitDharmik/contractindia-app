import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Screen, ScreenHeader } from "@/components";
import PressScale from "../../components/PressScale";
import { Routes } from "@/constants/routes";
import { formatINR } from "@/utils/formatters";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const T = {
  brand: "#4F46E5",
  brandDeep: "#312E81",
  brandSoft: "#EEF2FF",
  ink: "#0F172A",
  body: "#334155",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  surface: "#FFFFFF",
  canvas: "#F6F7FB",
  slateSoft: "#F1F5F9",
  success: "#059669",
  successSoft: "#ECFDF5",
  amber: "#D97706",
  amberSoft: "#FFFBEB",
  sky: "#0369A1",
  skySoft: "#F0F9FF",
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

// Values are placeholders until a stats endpoint is connected.
const KPIS = [
  { key: "users", label: "Total users", value: "0", delta: "+0%", icon: "account-group-outline", lib: "mci", tone: T.brand, soft: T.brandSoft },
  { key: "vendors", label: "Active vendors", value: "0", delta: "+0%", icon: "storefront-outline", lib: "mci", tone: T.sky, soft: T.skySoft },
  { key: "leads", label: "New leads (24h)", value: "0", delta: "+0%", icon: "lightning-bolt-outline", lib: "mci", tone: T.amber, soft: T.amberSoft },
  { key: "revenue", label: "Revenue (MTD)", value: formatINR(0), delta: "+0%", icon: "currency-inr", lib: "mci", tone: T.success, soft: T.successSoft },
];

const MODULES = [
  {
    key: "verification",
    label: "User verification",
    body: "Review registration verification requests",
    icon: "shield-check-outline",
    lib: "mci",
    tone: T.brand,
    soft: T.brandSoft,
    route: Routes.AdminUserVerification,
  },
  {
    key: "services",
    label: "Service management",
    body: "Manage the service catalog records",
    icon: "toolbox-outline",
    lib: "mci",
    tone: T.sky,
    soft: T.skySoft,
    route: Routes.ServiceManagement,
  },
  {
    key: "payments",
    label: "Payments",
    body: "Razorpay and Stripe reconciliation",
    icon: "credit-card-check-outline",
    lib: "mci",
    tone: T.success,
    soft: T.successSoft,
    route: Routes.AdminPayments,
  },
  {
    key: "plans",
    label: "Plans & pricing",
    body: "Subscription tiers and pricing",
    icon: "crown-outline",
    lib: "mci",
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
  const Icon = spec.lib === "mci" ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={style}>
      <Icon name={spec.icon} size={size} color={color} />
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
          <Ionicons name="shield-checkmark" size={13} color="#fff" />
          <Text style={styles.heroBadgeText}>Super admin</Text>
        </View>
        <Ionicons name="pulse-outline" size={18} color="rgba(255,255,255,0.8)" />
      </View>
      <Text style={styles.heroTitle}>Platform overview</Text>
      <Text style={styles.heroSub}>Key figures across users, vendors and revenue</Text>
    </View>
  );
}

function KpiTile({ kpi }) {
  return (
    <View style={styles.kpi}>
      <View style={styles.kpiTop}>
        <SpecIcon
          spec={kpi}
          color={kpi.tone}
          size={20}
          style={[styles.kpiIcon, { backgroundColor: kpi.soft }]}
        />
        <View style={styles.deltaChip}>
          <Ionicons name="trending-up" size={12} color={T.success} />
          <Text style={styles.deltaText}>{kpi.delta}</Text>
        </View>
      </View>
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
        {kpi.value}
      </Text>
      <Text style={styles.kpiLabel} numberOfLines={1}>
        {kpi.label}
      </Text>
    </View>
  );
}

function ModuleRow({ module, onPress }) {
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
        <Text style={styles.moduleLabel} numberOfLines={1}>
          {module.label}
        </Text>
        <Text style={styles.moduleBody} numberOfLines={2}>
          {module.body}
        </Text>
      </View>
      <View style={styles.moduleArrow}>
        <Ionicons name="chevron-forward" size={16} color={T.muted} />
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
        title="Admin panel"
        subtitle="ContractsIndia Super Admin"
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
            <Text style={styles.sectionTitle}>Key metrics</Text>
          </View>
          <View style={styles.kpiGrid}>
            {KPIS.map((kpi) => (
              <KpiTile key={kpi.key} kpi={kpi} />
            ))}
          </View>
        </FadeIn>

        <FadeIn delay={160}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Modules</Text>
            <Text style={styles.sectionCount}>{MODULES.length}</Text>
          </View>
          <View style={styles.moduleList}>
            {MODULES.map((module) => (
              <ModuleRow
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
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40, gap: 6 },

  /* Hero */
  hero: {
    borderRadius: 22,
    padding: 18,
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
    marginBottom: 14,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4, lineHeight: 17 },

  /* Section */
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: { color: T.ink, fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  sectionCount: {
    minWidth: 26,
    textAlign: "center",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    color: T.brand,
    backgroundColor: T.brandSoft,
    fontSize: 11,
    fontWeight: "800",
  },

  /* KPIs */
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  kpi: {
    width: "48%",
    flexGrow: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.surface,
    ...SHADOW,
  },
  kpiTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  kpiIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deltaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: T.successSoft,
  },
  deltaText: { color: T.success, fontSize: 11, fontWeight: "800" },
  kpiValue: { color: T.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  kpiLabel: { color: T.muted, fontSize: 12, fontWeight: "600", marginTop: 3 },

  /* Modules */
  moduleList: { gap: 10 },
  moduleWrap: { borderRadius: 18, ...SHADOW },
  module: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.surface,
    minHeight: 76,
  },
  moduleIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleText: { flex: 1, minWidth: 0 },
  moduleLabel: { color: T.ink, fontSize: 15, fontWeight: "800" },
  moduleBody: { color: T.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  moduleArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.slateSoft,
  },
});