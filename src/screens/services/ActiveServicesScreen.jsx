import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Screen, ScreenHeader } from "@/components";
import { colors } from "@/constants/colors";
import { radius, spacing, typography } from "@/constants/sizes";
import { useAuthStore } from "@/store/authStore";
import { UserServiceDetailsGetbyParam } from "@/api/api";

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

const serviceName = (service) =>
  service?.ServiceName || service?.serviceName || "Service";

function ActiveServiceCard({ service }) {
  const title = serviceName(service);
  const company =
    service?.CompanyName ||
    service?.companyName ||
    service?.ProviderName ||
    service?.providerName;
  const plan = service?.PlanName || service?.planName;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconWrap}>
          <Ionicons name="briefcase-outline" size={21} color={colors.primary} />
        </View>
        <View style={styles.activeBadge}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.activeText}>Active</Text>
        </View>
      </View>
      <Text style={styles.serviceTitle} numberOfLines={2}>
        {title}
      </Text>
      {!!company && (
        <View style={styles.detailRow}>
          <Ionicons
            name="business-outline"
            size={15}
            color={colors.textMuted}
          />
          <Text style={styles.detailText} numberOfLines={1}>
            {company}
          </Text>
        </View>
      )}
      {!!plan && (
        <View style={styles.detailRow}>
          <Ionicons name="ribbon-outline" size={15} color={colors.textMuted} />
          <Text style={styles.detailText} numberOfLines={1}>
            {plan}
          </Text>
        </View>
      )}
    </View>
  );
}

function EmptyState({ icon, title, message, action }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {action}
    </View>
  );
}

export default function ActiveServicesScreen() {
  const userId = useAuthStore((state) => state.user?.userId);
  const query = useQuery({
    queryKey: ["userservicesdetails", userId],
    queryFn: () => readServices(userId),
    enabled: Boolean(userId),
    retry: 1,
  });
  const services = useMemo(
    () => (query.data ?? []).filter(isActive),
    [query.data],
  );

  return (
    <Screen>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScreenHeader
        title="Active services"
        subtitle="Services currently available on your account"
        right={
          <Pressable
            onPress={() => query.refetch()}
            disabled={query.isFetching}
            accessibilityRole="button"
            accessibilityLabel="Refresh active services"
            style={styles.refreshButton}
          >
            {query.isFetching ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.primary}
              />
            )}
          </Pressable>
        }
        showBack
      />
      <FlatList
        data={services}
        keyExtractor={(item, index) =>
          String(
            item?.UserServiceID ??
              item?.userServiceID ??
              `${serviceName(item)}-${index}`,
          )
        }
        renderItem={({ item }) => <ActiveServiceCard service={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching && !query.isLoading}
            onRefresh={() => query.refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.summary}>
            <View>
              <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
              <Text style={styles.summaryTitle}>
                {services.length} active{" "}
                {services.length === 1 ? "service" : "services"}
              </Text>
            </View>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={colors.success}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          query.isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading active services…</Text>
            </View>
          ) : query.isError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Services could not load"
              message={query.error?.message || "Please try again."}
              action={
                <Pressable
                  onPress={() => query.refetch()}
                  style={styles.retryButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              }
            />
          ) : !userId ? (
            <EmptyState
              icon="person-outline"
              title="Account unavailable"
              message="Sign in again to view your active services."
            />
          ) : (
            <EmptyState
              icon="briefcase-outline"
              title="No active services yet"
              message="When you activate a service, it will appear here."
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  eyebrow: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  summaryTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xs,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  card: {
    padding: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "#ECFDF5",
  },
  activeText: {
    ...typography.small,
    color: colors.success,
    fontWeight: "700",
  },
  serviceTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  detailText: {
    ...typography.small,
    color: colors.textMuted,
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: "center",
  },
  emptyMessage: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  retryText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
});
