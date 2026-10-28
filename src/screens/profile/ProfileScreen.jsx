import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  Screen,
  ScreenHeader,
  Card,
  Avatar,
  Badge,
  Button,
  AlertBox,
} from "@/components";
import { useAuthStore } from "@/store/authStore";
import { Routes } from "@/constants/routes";
import { colors } from "@/constants/colors";
import { radius, spacing, typography } from "@/constants/sizes";
export default function ProfileScreen() {
  const nav = useNavigation();
  const user = useAuthStore((s) => s.user);

  const signOut = useAuthStore((s) => s.signOut);
  const [showSignOutAlert, setShowSignOutAlert] = useState(false);
  if (!user)
    return (
      <Screen>
        <ScreenHeader title="Profile" />
      </Screen>
    );
  const isAdmin = user.role === "admin";
  const isCommercial = user.role === "commercial";
  const roleLabel = isAdmin
    ? "ADMIN"
    : isCommercial
      ? "COMMERCIAL VENDOR"
      : "INDIVIDUAL BUYER";
  const roleBadgeTone = isAdmin ? "danger" : isCommercial ? "accent" : "info";
  const sections = [
    {
      title: "Admin workspace",
      items: [
        {
          icon: "shield-outline",
          label: "Admin dashboard",
          onPress: () => nav.navigate(Routes.AdminDashboard),
        },
        {
          icon: "shield-checkmark-outline",
          label: "User verification",
          onPress: () => nav.navigate(Routes.AdminUserVerification),
        },
        {
          icon: "business-outline",
          label: "Vendor approvals",
          onPress: () => nav.navigate(Routes.AdminVendorApprovals),
        },
        {
          icon: "people-outline",
          label: "User management",
          onPress: () => nav.navigate(Routes.AdminUsers),
        },
        {
          icon: "briefcase-outline",
          label: "Listing approvals",
          onPress: () => nav.navigate(Routes.AdminListings),
        },
        {
          icon: "construct-outline",
          label: "Service management",
          onPress: () => nav.navigate(Routes.ServiceManagement),
        },
        {
          icon: "folder-open-outline",
          label: "Document subcategories",
          onPress: () => nav.navigate(Routes.AdminDocumentSubcategories),
        },
        {
          icon: "lock-closed-outline",
          label: "Security",
          onPress: () => nav.navigate(Routes.AdminSecurity),
        },
        {
          icon: "sparkles-outline",
          label: "Plans management",
          onPress: () => nav.navigate(Routes.AdminPlans),
        },
        {
          icon: "cash-outline",
          label: "Payment records",
          onPress: () => nav.navigate(Routes.AdminPayments),
        },
        {
          icon: "bar-chart-outline",
          label: "System reports",
          onPress: () => nav.navigate(Routes.AdminReports),
        },
        {
          icon: "document-text-outline",
          label: "Form builder",
          onPress: () => nav.navigate(Routes.AdminFormBuilder),
        },
        {
          icon: "megaphone-outline",
          label: "Announcements",
          onPress: () => nav.navigate(Routes.AdminAnnouncements),
        },
      ],
    },
    {
      title: "Commercial workspace",
      items: [
        {
          icon: "business-outline",
          label: "Vendor dashboard",
          onPress: () => nav.navigate(Routes.VendorDashboard),
        },
        {
          icon: "home-outline",
          label: "Company profile",
          onPress: () => nav.navigate(Routes.VendorProfileWizard),
        },
        {
          icon: "briefcase-outline",
          label: "My services",
          onPress: () => nav.navigate(Routes.VendorServices),
        },
        {
          icon: "people-outline",
          label: "Client history",
          onPress: () => nav.navigate(Routes.ClientHistory),
        },
        {
          icon: "receipt-outline",
          label: "Invoices",
          onPress: () => nav.navigate(Routes.Invoices),
        },
        {
          icon: "bar-chart-outline",
          label: "Performance analytics",
          onPress: () => nav.navigate(Routes.Analytics),
        },
      ],
    },
    {
      title: "Individual workspace",
      items: [
        {
          icon: "briefcase-outline",
          label: "My services",
          onPress: () => nav.navigate(Routes.IndividualServices),
        },
        {
          icon: "calendar-outline",
          label: "Subscription history",
          onPress: () => nav.navigate(Routes.SubscriptionHistory),
        },
        {
          icon: "grid-outline",
          label: "Marketplace",
          onPress: () => nav.navigate(Routes.MarketplaceTab),
        },
      ],
    },
    {
      title: "Account & Security",
      items: [
        {
          icon: "person-outline",
          label: "Edit profile",
          onPress: () => nav.navigate(Routes.EditProfile),
        },

        {
          icon: "key-outline",
          label: "Change password",
          onPress: () => nav.navigate(Routes.ChangePassword),
        },
      ],
    },
    {
      title: "Activity",
      items: [
        {
          icon: "heart-outline",
          label: "Favorites",
          onPress: () => nav.navigate(Routes.Favorites),
        },
        {
          icon: "git-compare-outline",
          label: "Compare list",
          onPress: () => nav.navigate(Routes.Compare),
        },
        {
          icon: "megaphone-outline",
          label: isCommercial ? "Inquiries sent" : "My inquiries",
          onPress: () => nav.navigate(Routes.LeadsTab),
        },
      ],
    },
    {
      title: "Billing & Subscriptions",
      items: [
        {
          icon: "sparkles-outline",
          label: "Subscription plans",
          onPress: () => nav.navigate(Routes.Plans),
        },
        {
          icon: "cash-outline",
          label: "Credits & top up",
          onPress: () => nav.navigate(Routes.Credits),
        },
        {
          icon: "receipt-outline",
          label: "Purchase history",
          onPress: () => nav.navigate(Routes.PurchaseHistory),
        },
      ],
    },
    {
      title: "Preferences & Support",
      items: [
        {
          icon: "shield-checkmark-outline",
          label: "KYC verification",
          onPress: () => nav.navigate(Routes.KYC),
          badge: user.kycStatus,
        },
        {
          icon: "notifications-outline",
          label: "Notifications",
          onPress: () => nav.navigate(Routes.NotificationSettings),
        },
        {
          icon: "lock-closed-outline",
          label: "Privacy settings",
          onPress: () => nav.navigate(Routes.PrivacySettings),
        },
        {
          icon: "settings-outline",
          label: "App settings",
          onPress: () => nav.navigate(Routes.Settings),
        },
        {
          icon: "help-circle-outline",
          label: "Help & support",
          onPress: () => nav.navigate(Routes.SupportTickets),
        },
        {
          icon: "sparkles-outline",
          label: "AI Assistant",
          onPress: () => nav.navigate(Routes.AIAssistant),
        },
      ],
    },
  ];
  return (
    <Screen>
      <ScreenHeader title="Profile" />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xxxl,
        }}
      >
        <Card style={styles.profileCard}>
          <Avatar name={user.userName} size={64} uri={user.avatarUrl} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.name}>{user.userName}</Text>
            <Text style={styles.subtitle}>{user.email}</Text>
            <View
              style={{
                flexDirection: "row",
                gap: spacing.xs,
                marginTop: spacing.xs,
                flexWrap: "wrap",
              }}
            >
              <Badge label={roleLabel} tone={roleBadgeTone} />
              {user?.userRole !== 0 && (
                <Badge label={user.plan?.toUpperCase()} tone="accent" />
              )}
            </View>
          </View>
        </Card>

        <View style={styles.statsRow}>
          {/* !isAdmin ? (
            <>
              <Stat label="Role" value="Super Admin" />
              <Stat label="Access" value="Full" />
              <Stat label="Status" value="Active" />
            </>
          ) : */}
          {!isAdmin && (
            <>
              <Stat label="Credits" value={String(user.credits)} />
              <Stat label="Plan" value={user.plan} />
              <Stat label="KYC" value={user.kycStatus} />
            </>
          )}
        </View>

        {sections.map((sec) => (
          <View key={sec.title} style={{ marginTop: spacing.lg }}>
            <Text style={styles.section}>{sec.title}</Text>
            <Card style={{ padding: 0 }}>
              {sec.items.map((it, idx) => (
                <Pressable
                  key={it.label}
                  onPress={it.onPress}
                  style={[
                    styles.row,
                    idx < sec.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name={it.icon} size={20} color={colors.primary} />
                  <Text
                    style={[
                      typography.body,
                      { flex: 1, marginLeft: spacing.md },
                    ]}
                  >
                    {it.label}
                  </Text>
                  {"badge" in it && it.badge ? (
                    <Badge label={String(it.badge)} tone="info" />
                  ) : null}
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textMuted}
                    style={{ marginLeft: spacing.sm }}
                  />
                </Pressable>
              ))}
            </Card>
          </View>
        ))}

        <Button
          title="Sign out"
          variant="danger"
          onPress={() => setShowSignOutAlert(true)}
          fullWidth
          style={{ marginTop: spacing.xl }}
        />

        <Text style={styles.version}>ContractsIndia v1.0.0</Text>
      </ScrollView>
      <AlertBox
        visible={showSignOutAlert}
        title="Sign out?"
        message="You will need to sign in again."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          setShowSignOutAlert(false);
          void signOut();
        }}
        onCancel={() => setShowSignOutAlert(false)}
      />
    </Screen>
  );
}
function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  profileCard: { flexDirection: "row", alignItems: "center" },
  name: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    textTransform: "capitalize",
  },
  statLabel: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  section: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  version: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
