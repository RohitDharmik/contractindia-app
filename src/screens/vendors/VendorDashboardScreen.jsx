import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Screen, ScreenHeader, Card, Badge } from "@/components";
import PressScale from "@/components/PressScale";
import { mockLeads, mockServices } from "@/services/mockData";
import { Routes } from "@/constants/routes";
import { colors } from "@/constants/colors";
import { radius, spacing, typography } from "@/constants/sizes";
import { formatINR } from "@/utils/formatters";

const STATS = [
  {
    label: "Profile views",
    value: "1,284",
    delta: "+8.4%",
    icon: "account-eye-outline",
    tone: "#EEF2FF",
    iconColor: "#4F46E5",
  },
  {
    label: "Listing views",
    value: "3,012",
    delta: "+12.1%",
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
    value: "17%",
    delta: "+2.1%",
    icon: "chart-box-outline",
    tone: "#F0FDF4",
    iconColor: "#15803D",
  },
];

const ACTIONS = [
  { icon: "briefcase-outline", label: "My services", route: Routes.VendorServices },
  { icon: "domain", label: "Company profile", route: Routes.VendorProfileWizard },
  { icon: "account-group-outline", label: "Clients", route: Routes.ClientHistory },
  { icon: "receipt", label: "Invoices", route: Routes.Invoices },
  { icon: "rocket-launch-outline", label: "Boost visibility", route: Routes.Plans },
];

export default function VendorDashboardScreen() {
  const nav = useNavigation();

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
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={21}
              color={colors.primary}
            />
          </PressScale>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <View style={styles.statTop}>
                <View style={[styles.statIcon, { backgroundColor: stat.tone }]}>
                  <MaterialCommunityIcons
                    name={stat.icon}
                    size={19}
                    color={stat.iconColor}
                  />
                </View>
                <View style={styles.delta}>
                  <MaterialCommunityIcons
                    name="trending-up"
                    size={13}
                    color={colors.success}
                  />
                  <Text style={styles.statDelta}>{stat.delta}</Text>
                </View>
              </View>
              <Text style={styles.statValue} numberOfLines={1}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {stat.label}
              </Text>
            </Card>
          ))}
        </View>

        <View style={styles.earnings}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsEyebrow}>EARNINGS</Text>
              <Text style={styles.earningsTitle}>This month</Text>
            </View>
            <View style={styles.earningsIcon}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={20}
                color="#FFFFFF"
              />
            </View>
          </View>
          <Text style={styles.earningsValue}>{formatINR(184500)}</Text>
          <Text style={styles.earningsCaption}>Net of platform fees</Text>
          <View
            style={styles.barRow}
            accessibilityLabel="Weekly earnings trend chart"
          >
            {[40, 65, 50, 80, 70, 95, 60].map((height, index) => (
              <View key={index} style={styles.barTrack}>
                <View style={[styles.bar, { height: `${height}%` }]} />
              </View>
            ))}
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>Last 7 days</Text>
            <MaterialCommunityIcons
              name="chart-line"
              size={17}
              color="rgba(255,255,255,0.78)"
            />
          </View>
        </View>

        <SectionHeader title="Quick actions" />
        <View style={styles.actions}>
          {ACTIONS.map((action) => (
            <PressScale
              key={action.label}
              onPress={() => nav.navigate(action.route)}
              style={styles.actionWrap}
              contentStyle={styles.action}
              accessibilityLabel={action.label}
            >
              <View style={styles.actionIcon}>
                <MaterialCommunityIcons
                  name={action.icon}
                  size={21}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.actionLabel} numberOfLines={2}>
                {action.label}
              </Text>
              <MaterialCommunityIcons
                name="arrow-up-right"
                size={15}
                color={colors.textMuted}
                style={styles.actionArrow}
              />
            </PressScale>
          ))}
        </View>

        <SectionHeader
          title="My services"
          actionLabel="See all"
          onPress={() => nav.navigate(Routes.VendorServices)}
        />
        {mockServices.slice(0, 3).map((service) => (
          <Card key={service.id} style={styles.listCard}>
            <View style={styles.listRow}>
              <View style={styles.serviceIcon}>
                <MaterialCommunityIcons
                  name="briefcase-outline"
                  size={19}
                  color={colors.primary}
                />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle} numberOfLines={1}>
                  {service.name}
                </Text>
                <Text style={styles.listCaption} numberOfLines={1}>
                  {service.city} · {service.reviewsCount} reviews
                </Text>
              </View>
              <Badge
                label={service.featured ? "Featured" : "Active"}
                tone={service.featured ? "accent" : "success"}
              />
            </View>
          </Card>
        ))}

        <SectionHeader
          title="Latest leads"
          actionLabel="See all"
          onPress={() => nav.navigate(Routes.LeadInbox)}
        />
        {mockLeads.slice(0, 2).map((lead) => (
          <Card key={lead.id} style={styles.leadCard}>
            <View style={styles.leadHeading}>
              <View style={styles.leadIcon}>
                <MaterialCommunityIcons
                  name="account-arrow-left-outline"
                  size={18}
                  color="#0E7490"
                />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle} numberOfLines={1}>
                  {lead.buyerName}
                </Text>
                <Text style={styles.listCaption} numberOfLines={1}>
                  {lead.serviceName}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={19}
                color={colors.textMuted}
              />
            </View>
            <Text style={styles.leadMessage} numberOfLines={2}>
              {lead.message}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
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
          <MaterialCommunityIcons
            name="arrow-right"
            size={15}
            color={colors.primary}
          />
        </PressScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  statCard: {
    width: "48.5%",
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    minWidth: 0,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  delta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "#ECFDF5",
  },
  statDelta: { ...typography.small, color: colors.success, fontWeight: "700" },
  statValue: { ...typography.h2, color: colors.text },
  statLabel: { ...typography.small, color: colors.textMuted, marginTop: 3 },
  earnings: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  earningsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  earningsEyebrow: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  earningsTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  earningsIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  earningsValue: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: spacing.md,
  },
  earningsCaption: {
    ...typography.small,
    color: "rgba(255,255,255,0.68)",
    marginTop: 2,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 58,
    marginTop: spacing.md,
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.11)",
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  chartLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 11,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.h3, color: colors.text },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  sectionActionText: { ...typography.label, color: colors.primary },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.sm,
  },
  actionWrap: { width: "48.5%", borderRadius: radius.lg },
  action: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  actionLabel: {
    ...typography.label,
    flex: 1,
    color: colors.text,
    lineHeight: 17,
  },
  actionArrow: { marginLeft: 3 },
  listCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    elevation: 1,
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  listRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  listText: { flex: 1, minWidth: 0 },
  listTitle: { ...typography.bodyBold, color: colors.text },
  listCaption: { ...typography.small, color: colors.textMuted, marginTop: 3 },
  leadCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    elevation: 1,
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  leadHeading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  leadIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: "#ECFEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  leadMessage: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 20,
  },
});
