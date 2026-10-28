import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Screen, ScreenHeader, Card, Badge } from "@/components";
import { colors } from "@/constants/colors";
import { radius, spacing, typography } from "@/constants/sizes";
import { Routes } from "@/constants/routes";
import { formatINR } from "@/utils/formatters";
import {
  vendorApprovals,
  listingApprovals,
  adminPayments,
} from "@/services/adminMockData";
const kpis = [
  { label: "Total users", value: "0", delta: "+0%" },
  { label: "Active vendors", value: "0", delta: "+0%" },
  { label: "New leads (24h)", value: "0", delta: "+0%" },
  { label: "Revenue (MTD)", value: formatINR(0), delta: "+0%" },
];
const health = [
  { label: "API uptime", value: "0%", tone: "success" },
  { label: "Payment gateway", value: "Operational", tone: "success" },
  { label: "Push delivery", value: "Degraded", tone: "warning" },
  { label: "Storage usage", value: "62% of 1TB", tone: "info" },
];
const activity = [
  {
    id: "a1",
    who: "Rajesh Kumar",
    what: "submitted KYC documents",
    when: "2 min ago",
    icon: "document-text-outline",
  },
  {
    id: "a2",
    who: "Sthapati Architects",
    what: "published a new service",
    when: "14 min ago",
    icon: "briefcase-outline",
  },
  {
    id: "a3",
    who: "Reena Nair",
    what: "upgraded to Premium",
    when: "48 min ago",
    icon: "star-outline",
  },
  {
    id: "a4",
    who: "AeroSurvey India",
    what: "requested verification",
    when: "1 hr ago",
    icon: "shield-checkmark-outline",
  },
  {
    id: "a5",
    who: "Mohammed Iqbal",
    what: "payment failed (₹235)",
    when: "2 hr ago",
    icon: "alert-circle-outline",
  },
];
const modules = [
  {
    icon: "shield-checkmark-outline",
    label: "User verification",
    body: "Review registration verification requests",
    route: Routes.AdminUserVerification,
  },
  {
    icon: "construct-outline",
    label: "Service management",
    body: "Manage service catalog records",
    route: Routes.ServiceManagement,
  },{ 
    icon: "cash-outline",
    label: "Payments",
    body: "Razorpay/Stripe reconciliation",
    route: Routes.AdminPayments,
  },  {
    icon: "sparkles-outline",
    label: "Plans & pricing",
    body: "Subscription tiers",
    route: Routes.BusinessPlansScreen,
  },
  // {
  //   icon: "people-outline",
  //   label: "User management",
  //   body: "Create, edit, suspend, delete",
  //   route: Routes.AdminUsers,
  // },
  // {
  //   icon: "business-outline",
  //   label: "Vendor approvals",
  //   body: "KYC & document review queue",
  //   route: Routes.AdminVendorApprovals,
  // },
  // {
  //   icon: "briefcase-outline",
  //   label: "Listings",
  //   body: "Approve, feature, archive",
  //   route: Routes.AdminListings,
  // },
  // {
  //   icon: "grid-outline",
  //   label: "Categories",
  //   body: "Activate & feature categories",
  //   route: Routes.AdminCategories,
  // },

  
  // {
  //   icon: "bar-chart-outline",
  //   label: "Reports & exports",
  //   body: "Revenue, users, vendors",
  //   route: Routes.AdminReports,
  // },
  // {
  //   icon: "document-text-outline",
  //   label: "Forms engine",
  //   body: "Design dynamic forms",
  //   route: Routes.AdminFormBuilder,
  // },
  // {
  //   icon: "folder-open-outline",
  //   label: "Document subcategories",
  //   body: "Manage document taxonomy",
  //   route: Routes.AdminDocumentSubcategories,
  // },
  
  // {
  //   icon: "megaphone-outline",
  //   label: "Announcements",
  //   body: "Push, in-app, email",
  //   route: Routes.AdminAnnouncements,
  // },
];
export default function AdminDashboardScreen() {
  const nav = useNavigation();
  const pendingVendors = vendorApprovals.filter(
    (v) => v.status === "pending",
  ).length;
  const pendingListings = listingApprovals.filter(
    (l) => l.status === "pending",
  ).length;
  const failedPayments = adminPayments.filter(
    (p) => p.status === "failed",
  ).length;
  return (
    <Screen>
      <ScreenHeader
        title="Admin panel"
        subtitle="ContractsIndia Super Admin"
        showBack
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xxxl,
        }}
      >
        <View style={styles.grid}>
          {kpis.map((k) => (
            <Card key={k.label} style={styles.kpi}>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={styles.delta}>{k.delta}</Text>
            </Card>
          ))}
        </View>

        <Text style={styles.section}>Action required</Text>
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => nav.navigate(Routes.AdminVendorApprovals)}
            style={[styles.action, { borderColor: colors.warning }]}
          >
            <Ionicons
              name="business-outline"
              size={18}
              color={colors.warning}
            />
            <Text style={styles.actionValue}>{pendingVendors}</Text>
            <Text style={styles.actionLabel}>Vendor approvals</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate(Routes.AdminListings)}
            style={[styles.action, { borderColor: colors.info }]}
          >
            <Ionicons name="briefcase-outline" size={18} color={colors.info} />
            <Text style={styles.actionValue}>{pendingListings}</Text>
            <Text style={styles.actionLabel}>Listings pending</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate(Routes.AdminPayments)}
            style={[styles.action, { borderColor: colors.danger }]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={colors.danger}
            />
            <Text style={styles.actionValue}>{failedPayments}</Text>
            <Text style={styles.actionLabel}>Payment failures</Text>
          </Pressable>
        </View>

        {/*  <Text style={styles.section}>System health</Text>
        <Card>
          {health.map((h, i) => (<View key={h.label} style={[styles.healthRow, i < health.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={typography.body}>{h.label}</Text>
              <Badge label={h.value} tone={h.tone}/>
            </View>))}
        </Card> */}

        <Text style={styles.section}>Recent activity</Text>
        {activity.map((a) => (
          <Card
            key={a.id}
            style={{
              marginBottom: spacing.sm,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={styles.queueIcon}>
              <Ionicons name={a.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={typography.body}>
                <Text style={typography.bodyBold}>{a.who}</Text> {a.what}
              </Text>
              <Text
                style={{
                  ...typography.small,
                  color: colors.textMuted,
                  marginTop: 2,
                }}
              >
                {a.when}
              </Text>
            </View>
          </Card>
        ))}

        <Text style={[styles.section, { marginTop: spacing.lg }]}>Modules</Text>
        <View style={styles.grid}>
          {modules.map((m) => (
            <Pressable
              key={m.label}
              onPress={() => nav.navigate(m.route)}
              style={styles.module}
            >
              <Ionicons name={m.icon} size={22} color={colors.primary} />
              <Text style={[typography.bodyBold, { marginTop: 4 }]}>
                {m.label}
              </Text>
              <Text
                style={{
                  ...typography.small,
                  color: colors.textMuted,
                  marginTop: 2,
                }}
              >
                {m.body}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  kpi: { width: "48%", marginBottom: spacing.sm },
  kpiValue: { ...typography.h2, color: colors.text },
  kpiLabel: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  delta: {
    ...typography.small,
    color: colors.success,
    fontWeight: "700",
    marginTop: 4,
  },
  section: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  queueIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  module: {
    width: "48%",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  actionRow: { flexDirection: "row", gap: spacing.sm },
  action: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: "flex-start",
  },
  actionValue: { ...typography.h2, color: colors.text, marginTop: 4 },
  actionLabel: { ...typography.small, color: colors.textMuted },
  healthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
});
