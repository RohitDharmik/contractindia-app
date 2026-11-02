import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserServicesByParam,
  UserServiceDetailsSave,
  UserServiceDetailsUpdate,
  UserSubscriptionDetailGet,
} from "@/api/api";
import { Screen, ScreenHeader } from "@/components";
import { Routes } from "@/constants/routes";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/sizes";
import { useAuthStore } from "@/store/authStore";

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const unwrapList = (response) => {
  let value = response?.data ?? response ?? [];
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      throw new Error("The server returned data in an unsupported format.");
    }
  }
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return [value];
  return [];
};

const firstValue = (source, ...keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return "";
};

const isSuccessful = (response) => {
  const payload = Array.isArray(response)
    ? response[0]
    : Array.isArray(response?.data)
      ? response.data[0]
      : response?.data ?? response;
  const payloadStatus = firstValue(payload, "status", "Status");
  if (payloadStatus !== "") {
    if (typeof payloadStatus === "number") {
      return payloadStatus >= 200 && payloadStatus < 300;
    }
    return [true, 1, "1", "success"].includes(
      typeof payloadStatus === "string"
        ? payloadStatus.toLowerCase()
        : payloadStatus,
    );
  }
  if (typeof payload?.success === "boolean") return payload.success;
  if (payload?.error || payload?.errors) return false;
  return true;
};

const ensureSuccess = (response, fallback) => {
  if (!isSuccessful(response)) {
    throw new Error(response?.message || fallback);
  }
};

const serviceIdOf = (item) =>
  String(firstValue(item, "ServiceID", "serviceID", "serviceId", "id"));

const isActiveRow = (item) =>
  Number(firstValue(item, "IsActive", "isActive")) === 1;

const buildServiceTree = (items) => {
  const nodes = new Map();
  items.forEach((item) => {
    const id = serviceIdOf(item);
    if (id) nodes.set(id, { id, item, parent: null, children: [] });
  });

  nodes.forEach((node) => {
    const parentId = String(
      firstValue(node.item, "ParentServiceID", "parentServiceID", "parentServiceId") || "",
    );
    const parent = nodes.get(parentId);
    if (!parent || parent === node) return;

    let ancestor = parent;
    while (ancestor && ancestor !== node) ancestor = ancestor.parent;
    if (ancestor === node) return;

    node.parent = parent;
    parent.children.push(node);
  });

  return Array.from(nodes.values()).filter((node) => !node.parent);
};

/* -------------------------------------------------------------------------- */
/*                                  SCREEN                                    */
/* -------------------------------------------------------------------------- */

export default function ServicesScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.userId);

  const [serviceBusyId, setServiceBusyId] = useState("");
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const busyRef = useRef("");
  const expansionInitialized = useRef(false);

  const servicesQuery = useQuery({
    queryKey: ["company-profile-services", userId],
    queryFn: () => getUserServicesByParam(`userId=${userId}`),
    select: unwrapList,
    enabled: !!userId,
    retry: false,
  });

  const subscriptionsQuery = useQuery({
    queryKey: ["company-profile-subscriptions", userId],
    queryFn: () => UserSubscriptionDetailGet(`userId=${userId}`),
    select: unwrapList,
    enabled: !!userId,
    retry: false,
  });

  const refetchServices = servicesQuery.refetch;
  const refetchSubscriptions = subscriptionsQuery.refetch;
  useFocusEffect(
    useCallback(() => {
      if (!userId) return undefined;
      refetchServices();
      refetchSubscriptions();
      return undefined;
    }, [refetchServices, refetchSubscriptions, userId]),
  );

  const serviceItems = servicesQuery.data ?? [];
  const serviceTree = useMemo(() => buildServiceTree(serviceItems), [serviceItems]);

  useEffect(() => {
    if (!servicesQuery.isSuccess || expansionInitialized.current) return;
    setExpandedIds(
      new Set(
        serviceTree
          .filter((node) => node.children.length > 0)
          .map((node) => node.id),
      ),
    );
    expansionInitialized.current = true;
  }, [serviceTree, servicesQuery.isSuccess]);

  const toggleExpanded = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeSubscription = (subscriptionsQuery.data ?? []).find(isActiveRow);
  const hasActivePlan = !!activeSubscription;
  const planName =
    firstValue(activeSubscription, "PlanName", "planName") || "Business";
  const maxServices = Number(
    firstValue(activeSubscription, "maxNoofServices", "MaxNoofServices") || 0,
  );
  const activeServices = serviceItems.filter(isActiveRow);
  const activeCount = activeServices.length;
  const usagePercent =
    maxServices > 0
      ? Math.min(100, Math.round((activeCount / maxServices) * 100))
      : 0;
  const limitReached = maxServices > 0 && activeCount >= maxServices;

  const activateService = async (service) => {
    const id = serviceIdOf(service);
    if (busyRef.current) return;
    if (!hasActivePlan) {
      Alert.alert(
        "Subscription required",
        "Choose a plan before activating business services.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "View plans",
            onPress: () => navigation.navigate(Routes.PlansAndSubscriptionsScreen),
          },
        ],
      );
      return;
    }
    if (limitReached) {
      Alert.alert(
        "Plan limit reached",
        `Your current plan allows up to ${maxServices} active services.`,
      );
      return;
    }

    busyRef.current = id;
    setServiceBusyId(id);
    try {
      const userServiceId =
        Number(firstValue(service, "UserServiceID", "userServiceID")) || 0;
      const payload = {
        userServiceID: userServiceId,
        userID: userId,
        serviceID: firstValue(service, "ServiceID", "serviceID", "serviceId"),
        serviceName: firstValue(service, "ServiceName", "serviceName", "name"),
        planID: firstValue(activeSubscription, "PlanID", "planID") || 0,
        planName: firstValue(activeSubscription, "PlanName", "planName") || "",
        amount: Number(firstValue(service, "Amount", "amount")) || 0,
        enterredBy: userId,
        isActive: 1,
      };

      const response = userServiceId
        ? await UserServiceDetailsUpdate(payload)
        : await UserServiceDetailsSave(payload);
      ensureSuccess(response, "The service could not be activated.");
      await queryClient.invalidateQueries({
        queryKey: ["company-profile-services", userId],
      });
    } catch (error) {
      Alert.alert("Could not activate service", error?.message || "Please try again.");
    } finally {
      busyRef.current = "";
      setServiceBusyId("");
    }
  };

  const renderNode = (node, depth = 0) => {
    const { item: service, id, children } = node;
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(id);
    const isActive = isActiveRow(service);
    const isNested = depth > 0;
    const busy = serviceBusyId === id;
    const name =
      firstValue(service, "ServiceName", "serviceName", "name") || "Business service";
    const description = firstValue(
      service,
      "ServiceDescription",
      "serviceDescription",
      "description",
    );

    return (
      <React.Fragment key={id}>
        <View
          style={[
            styles.card,
            isNested && styles.cardNested,
            isActive && styles.cardActive,
          ]}
        >
          <View style={styles.cardTop}>
            <View
              style={[
                styles.iconWrap,
                isNested && styles.iconWrapNested,
                isActive && styles.iconWrapActive,
              ]}
            >
              <Ionicons
                name={isActive ? "checkmark" : isNested ? "construct-outline" : "briefcase-outline"}
                size={isNested ? 15 : 17}
                color={isActive ? "#15803D" : colors.primary}
              />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {name}
              </Text>
              {!!description && (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {description}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.cardFooter}>
            {hasChildren ? (
              <Pressable
                onPress={() => toggleExpanded(id)}
                style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${isExpanded ? "Collapse" : "Expand"} ${name} sub-services`}
                accessibilityState={{ expanded: isExpanded }}
                hitSlop={4}
              >
                <Text style={styles.toggleText}>
                  {children.length} sub-service{children.length === 1 ? "" : "s"}
                </Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={colors.primary}
                />
              </Pressable>
            ) : (
              <View />
            )}

            {isActive ? (
              <View style={styles.activeChip}>
                <View style={styles.activeDot} />
                <Text style={styles.activeChipText}>Active</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => activateService(service)}
                disabled={!!serviceBusyId}
                style={({ pressed }) => [
                  styles.activateBtn,
                  pressed && styles.pressed,
                  !!serviceBusyId && styles.disabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Activate ${name}`}
                accessibilityState={{ busy, disabled: !!serviceBusyId }}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="add" size={15} color="#fff" />
                )}
                <Text style={styles.activateText}>{busy ? "Adding" : "Activate"}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {hasChildren && isExpanded && (
          <View style={styles.childrenRail}>
            {children.map((child) => renderNode(child, depth + 1))}
          </View>
        )}
      </React.Fragment>
    );
  };

  if (!userId) {
    return (
      <Screen>
        <ScreenHeader title="Services" subtitle="Your offerings" showBack />
        <View style={styles.centerState}>
          <Ionicons name="person-circle-outline" size={34} color={colors.textMuted} />
          <Text style={styles.stateTitle}>Account details unavailable</Text>
          <Text style={styles.stateBody}>Sign in again to manage your services.</Text>
        </View>
      </Screen>
    );
  }

  const loading = servicesQuery.isLoading || subscriptionsQuery.isLoading;
  const failed = servicesQuery.isError || subscriptionsQuery.isError;

  return (
    <Screen>
      <ScreenHeader title="Services" subtitle="Your offerings" showBack />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan hero */}
        <View style={[styles.plan, !hasActivePlan && styles.planWarning]}>
          <View style={styles.planTop}>
            <View
              style={[
                styles.planIcon,
                !hasActivePlan && styles.planIconWarning,
              ]}
            >
              <Ionicons
                name={hasActivePlan ? "shield-checkmark" : "card-outline"}
                size={18}
                color={hasActivePlan ? "#15803D" : "#B45309"}
              />
            </View>
            <View style={styles.planCopy}>
              <Text style={styles.planEyebrow}>
                {hasActivePlan ? "ACTIVE PLAN" : "PLAN REQUIRED"}
              </Text>
              <Text style={styles.planTitle} numberOfLines={1}>
                {hasActivePlan ? planName : "Choose a plan to activate services"}
              </Text>
            </View>
            {!hasActivePlan ? (
              <Pressable
                onPress={() => navigation.navigate(Routes.PlansAndSubscriptionsScreen)}
                style={({ pressed }) => [styles.planAction, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="View subscription plans"
              >
                <Text style={styles.planActionText}>View plans</Text>
                <Ionicons name="arrow-forward" size={13} color="#fff" />
              </Pressable>
            ) : null}
          </View>

          {hasActivePlan && maxServices > 0 ? (
            <View style={styles.meterWrap}>
              <View style={styles.meterLabels}>
                <Text style={styles.meterText}>
                  {activeCount} of {maxServices} services active
                </Text>
                <Text style={styles.meterPercent}>{usagePercent}%</Text>
              </View>
              <View style={styles.meterTrack}>
                <View style={[styles.meterFill, { width: `${usagePercent}%` }]} />
              </View>
            </View>
          ) : (
            <Text style={styles.planHint}>
              {hasActivePlan
                ? `${activeCount} services active`
                : "Browse available plans to activate service listings."}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.stat, styles.statPrimary]}>
            <Text style={styles.statValuePrimary}>{activeCount}</Text>
            <Text style={styles.statLabelPrimary}>Active</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{serviceItems.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateBody}>Loading your services…</Text>
          </View>
        ) : failed ? (
          <View style={styles.stateBox}>
            <View style={styles.stateIconError}>
              <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
            </View>
            <Text style={styles.stateBody}>Services could not be loaded.</Text>
            <Pressable
              onPress={() => {
                servicesQuery.refetch();
                subscriptionsQuery.refetch();
              }}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : serviceTree.length === 0 ? (
          <View style={styles.stateBox}>
            <View style={styles.stateIcon}>
              <Ionicons name="file-tray-outline" size={22} color={colors.textMuted} />
            </View>
            <Text style={styles.stateBody}>No services are available for this account.</Text>
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Available services</Text>
              <Text style={styles.listHint}>Expand a service to see sub-services</Text>
            </View>
            {serviceTree.map((node) => renderNode(node))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  STYLES                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },

  /* Plan hero */
  plan: {
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  planWarning: { backgroundColor: "#1E293B" },
  planTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  planIconWarning: { backgroundColor: "#FEF3C7" },
  planCopy: { flex: 1, minWidth: 0 },
  planEyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  planTitle: {
    marginTop: 3,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "750",
  },
  planAction: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  planActionText: { color: "#FFFFFF", fontSize: 11, fontWeight: "750" },
  planHint: {
    marginTop: spacing.sm,
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    lineHeight: 16,
  },
  meterWrap: { marginTop: spacing.md, gap: 8 },
  meterLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meterText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600" },
  meterPercent: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  meterTrack: {
    height: 6,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  meterFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.accent,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EDF3",
  },
  statPrimary: { backgroundColor: "#EDF4FA", borderColor: "#D6E4EE" },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  statValuePrimary: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  statLabel: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  statLabelPrimary: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  /* List */
  listHeader: { marginBottom: spacing.sm, gap: 2 },
  listTitle: { color: colors.text, fontSize: 13, fontWeight: "750" },
  listHint: { color: colors.textMuted, fontSize: 10 },

  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EDF3",
    shadowColor: "#123B62",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardNested: {
    marginBottom: spacing.xs,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: "#FAFBFC",
    shadowOpacity: 0,
    elevation: 0,
  },
  cardActive: { borderColor: "#CFE5D5" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF4FA",
  },
  iconWrapNested: { width: 32, height: 32, borderRadius: 10 },
  iconWrapActive: { backgroundColor: "#E7F2EA" },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "750",
    lineHeight: 18,
  },
  cardDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 40,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  toggle: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    backgroundColor: "#EDF4FA",
  },
  toggleText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  activeChip: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    backgroundColor: "#E7F2EA",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#15803D",
  },
  activeChipText: { color: "#15803D", fontSize: 11, fontWeight: "750" },
  activateBtn: {
    minWidth: 104,
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    borderRadius: 11,
    backgroundColor: colors.primary,
  },
  activateText: { color: "#FFFFFF", fontSize: 11, fontWeight: "750" },
  childrenRail: {
    marginLeft: spacing.md,
    paddingLeft: spacing.sm,
    marginBottom: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: "#DCE6EF",
  },

  /* States */
  loading: {
    minHeight: 132,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  stateBox: {
    minHeight: 132,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
  },
  stateIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  stateIconError: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDF1F1",
  },
  stateTitle: { color: colors.text, fontSize: 16, fontWeight: "750", textAlign: "center" },
  stateBody: {
    maxWidth: 260,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  retryBtn: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: "#EDF4FA",
  },
  retryText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xl,
  },

  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.48 },
});