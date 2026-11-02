import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Screen, ScreenHeader, EmptyState } from "@/components";
import PressScale from "@/components/PressScale";
import { mockLeads } from "@/services/mockData";
import { Routes } from "@/constants/routes";
import { colors } from "@/constants/colors";
import { radius, spacing, typography } from "@/constants/sizes";
import { formatINR } from "@/utils/formatters";
import { UserServiceDetailsGetbyParam } from "@/api/api";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

/* -------------------------------------------------------------------------- */
/*                                   DATA                                     */
/* -------------------------------------------------------------------------- */

const isActive = (service) => {
  const value = service?.IsActive ?? service?.isActive ?? service?.isactive;
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value).toLowerCase() === "true" ||
    String(value).toLowerCase() === "active"
  );
};

const STATS = [
  {
    label: "Profile views",
    value: "0",
    delta: "0%",
    icon: "account-eye-outline",
    tone: "#EEF2FF",
    iconColor: "#4F46E5",
  },
  {
    label: "Listing views",
    value: "0",
    delta: "0%",
    icon: "eye-outline",
    tone: "#ECFEFF",
    iconColor: "#0E7490",
  },
  {
    label: "New leads",
    value: String(mockLeads.length),
    delta: "+3 today",
    icon: "account-multiple-plus-outline",
    tone: "#FFF7ED",
    iconColor: "#C2410C",
  },
  {
    label: "Conversion",
    value: "0%",
    delta: "0%",
    icon: "chart-box-outline",
    tone: "#F0FDF4",
    iconColor: "#15803D",
  },
];

const PRIMARY_ACTIONS = [
  { icon: "briefcase-outline", label: "My services", route: Routes.ActiveServices, tone: "#EEF2FF", iconColor: "#4F46E5" },
  { icon: "domain", label: "Company profile", route: Routes.VendorProfileWizard, tone: "#ECFEFF", iconColor: "#0E7490" },
  { icon: "account-group-outline", label: "Clients", route: Routes.ClientHistory, tone: "#FFF7ED", iconColor: "#C2410C" },
  { icon: "receipt", label: "Invoices", route: Routes.Invoices, tone: "#F0FDF4", iconColor: "#15803D" },
];

const BOOST_ACTION = {
  icon: "rocket-launch-outline",
  label: "Explore plans",
  caption: "Compare plans and manage your subscription",
  route: Routes.PlansAndSubscriptionsScreen,
};

const EARNINGS_BARS = [
  { day: "M", height: 40 },
  { day: "T", height: 65 },
  { day: "W", height: 50 },
  { day: "T", height: 80 },
  { day: "F", height: 70 },
  { day: "S", height: 95 },
  { day: "S", height: 60 },
];

const readServices = async (userId) => {
  const response = await UserServiceDetailsGetbyParam(`userId=${userId}`);
  if (response?.status === false) {
    throw new Error(response.message || "Unable to load your services.");
  }

  let rows = response?.data ?? response?.value ?? response;
  if (typeof rows === "string") {
    try {
      rows = JSON.parse(rows);
    } catch {
      throw new Error("The services response could not be read.");
    }
  }
  if (rows && !Array.isArray(rows) && Array.isArray(rows.data)) {
    rows = rows.data;
  }
  return Array.isArray(rows) ? rows : [];
};

/* -------------------------------------------------------------------------- */
/*                                  SCREEN                                    */
/* -------------------------------------------------------------------------- */

export default function VendorDashboardScreen() {
  const nav = useNavigation();
  const userId = useAuthStore((state) => state.user?.userId);

  const {
    data: serviceList = [],
    isLoading: servicesLoading,
    isError: servicesError,
  } = useQuery({
    queryKey: ["userservicesdetails", userId],
    queryFn: () => readServices(userId),
    enabled: Boolean(userId),
    retry: 1,
  });

  const services = useMemo(() => serviceList.filter(isActive), [serviceList]);

  return (
    <Screen>
      <ScreenHeader
        title="Your business"
        subtitle="Vendor dashboard"
        showBack
        right={
          <PressScale
            onPress={() => nav.navigate(Routes.Analytics)}
            contentStyle={styles.headerAction}
            accessibilityLabel="Open analytics"
          >
            <MaterialCommunityIcons name="chart-box-outline" size={20} color={colors.primary} />
          </PressScale>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Earnings hero */}
        <EarningsCard />

        {/* Stats */}
        {/* <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <StatTile key={stat.label} stat={stat} />
          ))}
        </View> */}

        {/* Quick actions */}
        <SectionHeader title="Quick actions" />
        <View style={styles.actionsGrid}>
          {PRIMARY_ACTIONS.map((action) => (
            <ActionTile
              key={action.label}
              action={action}
              onPress={() => nav.navigate(action.route)}
            />
          ))}
        </View>

        <PressScale
          onPress={() => nav.navigate(BOOST_ACTION.route)}
          style={styles.boostWrap}
          contentStyle={styles.boost}
          accessibilityLabel={BOOST_ACTION.label}
        >
          <LinearGradient
            colors={["#FFF7ED", "#FFEDD5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.boostIcon}>
            <MaterialCommunityIcons name={BOOST_ACTION.icon} size={20} color="#C2410C" />
          </View>
          <View style={styles.boostText}>
            <Text style={styles.boostTitle}>{BOOST_ACTION.label}</Text>
            <Text style={styles.boostCaption} numberOfLines={2}>
              {BOOST_ACTION.caption}
            </Text>
          </View>
          <View style={styles.boostArrow}>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#C2410C" />
          </View>
        </PressScale>

        {/* My services */}
        <SectionHeader
          title="My services"
          actionLabel="See all"
          onPress={() => nav.navigate(Routes.ActiveServices)}
        />

        {servicesLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : services.length === 0 ? (
          <DashCard>
            <EmptyState
              icon={servicesError ? "alert-circle-outline" : "briefcase-outline"}
              title={servicesError ? "Services unavailable" : "No active services"}
              body={
                servicesError
                  ? "Your services could not be loaded. Please try again later."
                  : "Your active services will appear here."
              }
            />
          </DashCard>
        ) : (
          services.slice(0, 3).map((service, index) => (
            <ServiceRow
              key={service?.UserServiceID ?? service?.userServiceID ?? `service-${index}`}
              service={service}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                               CARD SYSTEM                                  */
/* -------------------------------------------------------------------------- */

/** Base surface used by every card on this screen. */
function DashCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Pill showing a delta; colour reflects direction. */
function DeltaPill({ delta }) {
  const isUp = delta.startsWith("+");
  const isDown = delta.startsWith("-");
  const palette = isUp
    ? { bg: "#ECFDF5", fg: colors.success, icon: "trending-up" }
    : isDown
      ? { bg: "#FEF2F2", fg: "#DC2626", icon: "trending-down" }
      : { bg: colors.surfaceAlt, fg: colors.textMuted, icon: "minus" };

  return (
    <View style={[styles.deltaPill, { backgroundColor: palette.bg }]}>
      <MaterialCommunityIcons name={palette.icon} size={12} color={palette.fg} />
      <Text style={[styles.deltaText, { color: palette.fg }]}>{delta}</Text>
    </View>
  );
}

function StatTile({ stat }) {
  return (
    <DashCard style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, { backgroundColor: stat.tone }]}>
          <MaterialCommunityIcons name={stat.icon} size={18} color={stat.iconColor} />
        </View>
        <DeltaPill delta={stat.delta} />
      </View>
      <Text style={styles.statValue} numberOfLines={1}>
        {stat.value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {stat.label}
      </Text>
    </DashCard>
  );
}

function ActionTile({ action, onPress }) {
  return (
    <PressScale
      onPress={onPress}
      style={styles.actionWrap}
      contentStyle={styles.action}
      accessibilityLabel={action.label}
    >
      <View style={styles.actionTopRow}>
        <View style={[styles.actionIcon, { backgroundColor: action.tone }]}>
          <MaterialCommunityIcons name={action.icon} size={20} color={action.iconColor} />
        </View>
        <View style={styles.actionArrow}>
          <MaterialCommunityIcons name="arrow-top-right" size={14} color={colors.textMuted} />
        </View>
      </View>
      <Text style={styles.actionLabel} numberOfLines={2}>
        {action.label}
      </Text>
    </PressScale>
  );
}

function EarningsCard() {
  return (
    <View style={styles.earnings}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Decorative glow */}
      <View style={styles.earningsGlow} pointerEvents="none" />

      <View style={styles.earningsHeader}>
        <View>
          <Text style={styles.earningsEyebrow}>EARNINGS</Text>
          <Text style={styles.earningsTitle}>This month</Text>
        </View>
        <View style={styles.earningsIcon}>
          <MaterialCommunityIcons name="wallet-outline" size={19} color="#FFFFFF" />
        </View>
      </View>

      <Text style={styles.earningsValue}>{formatINR(0)}</Text>
      <Text style={styles.earningsCaption}>Net of platform fees</Text>

      <View
        style={styles.barRow}
        accessibilityLabel="Weekly earnings trend chart"
      >
        {EARNINGS_BARS.map((bar, index) => {
          const isLast = index === EARNINGS_BARS.length - 1;
          return (
            <View key={index} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: `${bar.height}%` },
                    isLast && styles.barActive,
                  ]}
                />
              </View>
              <Text style={[styles.barDay, isLast && styles.barDayActive]}>
                {bar.day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ServiceRow({ service }) {
  const serviceName =
    service?.ServiceName || service?.serviceName || service?.name || "Service";
  const planName = service?.PlanName || service?.planName;

  return (
    <DashCard style={styles.serviceCard}>
      <View style={styles.serviceIcon}>
        <MaterialCommunityIcons name="briefcase-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.serviceText}>
        <Text style={styles.serviceTitle} numberOfLines={1}>
          {serviceName}
        </Text>
        <Text style={styles.serviceCaption} numberOfLines={1}>
          {planName || "Active service"}
        </Text>
      </View>
      <View style={styles.statusPill}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{planName ? planName : "Active"}</Text>
      </View>
    </DashCard>
  );
}

function SectionHeader({ title, actionLabel, onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress ? (
        <PressScale
          onPress={onPress}
          contentStyle={styles.sectionAction}
          accessibilityLabel={`${actionLabel} ${title}`}
        >
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
          <MaterialCommunityIcons name="arrow-right" size={14} color={colors.primary} />
        </PressScale>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  STYLES                                    */
/* -------------------------------------------------------------------------- */

const SHADOW = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 3,
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
  },

  headerAction: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...SHADOW,
    shadowOpacity: 0.05,
  },

  /* Card base */
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 23, 42, 0.06)",
    padding: spacing.md,
    ...SHADOW,
  },

  /* Earnings hero */
  earnings: {
    padding: spacing.lg,
    borderRadius: 24,
    overflow: "hidden",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    ...SHADOW,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  earningsGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -70,
    right: -50,
  },
  earningsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  earningsEyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  earningsTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 3,
  },
  earningsIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  earningsValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: spacing.md,
  },
  earningsCaption: {
    ...typography.small,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 72,
    marginTop: spacing.lg,
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    gap: 6,
  },
  barTrack: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  barActive: {
    backgroundColor: colors.accent,
  },
  barDay: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
  },
  barDayActive: {
    color: "#FFFFFF",
  },

  /* Stats */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  statCard: {
    width: "48.5%",
    marginBottom: spacing.sm,
    borderRadius: 20,
  },
  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  deltaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  deltaText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    letterSpacing: -0.4,
  },
  statLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },

  /* Section header */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    letterSpacing: -0.2,
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    gap: 4,
    paddingHorizontal: spacing.xs,
  },
  sectionActionText: {
    ...typography.label,
    color: colors.primary,
  },

  /* Actions */
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.sm,
  },
  actionWrap: {
    width: "48.5%",
    borderRadius: 20,
  },
  action: {
    minHeight: 96,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 23, 42, 0.06)",
    justifyContent: "space-between",
    ...SHADOW,
  },
  actionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 18,
  },

  /* Boost banner */
  boostWrap: {
    marginTop: spacing.sm,
    borderRadius: 20,
    overflow: "hidden",
  },
  boost: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(194, 65, 12, 0.15)",
    overflow: "hidden",
    gap: spacing.sm,
  },
  boostIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  boostText: {
    flex: 1,
    minWidth: 0,
  },
  boostTitle: {
    ...typography.bodyBold,
    color: "#9A3412",
  },
  boostCaption: {
    ...typography.small,
    color: "#C2410C",
    opacity: 0.8,
    marginTop: 2,
  },
  boostArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Services */
  loadingBox: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 18,
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceText: {
    flex: 1,
    minWidth: 0,
  },
  serviceTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  serviceCaption: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "#ECFDF5",
    maxWidth: 130,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
  },
});