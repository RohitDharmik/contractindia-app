import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Screen, Avatar, Badge } from "@/components";
import PressScale from "../../components/PressScale";
import { useAuthStore } from "@/store/authStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { useCategoryStore } from "@/store/categoryStore";
import { Routes } from "@/constants/routes";
import { spacing } from "@/constants/sizes";
import { colors } from "@/constants/colors";
import { buildTree, fetchMenu, getAncestorIds } from "@/utils/serviceData";
import AdminDashboardScreen from "@/screens/admin/AdminDashboardScreen";
import VendorDashboardScreen from "@/screens/vendors/VendorDashboardScreen";
import { CompanyPreview } from "@/screens/companies/CompanyListScreen";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const T = {
  brand: colors.primary,
  indigoSoft: colors.surfaceAlt,
  ink: colors.text,
  body: "#334155",
  muted: colors.textMuted,
  faint: "#94A3B8",
  line: colors.border,
  surface: colors.surface,
  canvas: colors.bg,
  slateSoft: colors.surfaceAlt,
  danger: colors.danger,
  amberSoft: "#FFFBEB",
  amberLine: "#FDE68A",
  amberInk: colors.accentDark,
};

const SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};

// Rotating tones so neighbouring cards do not look identical.
const TONES = [
  { bg: colors.surfaceAlt, fg: colors.primary },
  { bg: "#ECFEFF", fg: "#0E7490" },
  { bg: "#FFF7ED", fg: "#C2410C" },
  { bg: "#F0FDF4", fg: "#15803D" },
  { bg: "#FDF2F8", fg: "#BE185D" },
  { bg: "#F5F3FF", fg: "#6D28D9" },
];

// Trade icons matched against the service name. Order matters: first hit wins.
const TRADE_ICONS = [
  [/electr|power|solar|wire/i, "lightning-bolt-outline"],
  [/arch|interior|design/i, "floor-plan"],
  [/civil|construct|build|infra|epc/i, "office-building-outline"],
  [/plumb|water|sanitar/i, "pipe-wrench"],
  [/hvac|air|cool/i, "air-conditioner"],
  [/fire/i, "fire"],
  [/legal|law|tender|audit|account/i, "scale-balance"],
  [/material|steel|cement|supply/i, "cube-outline"],
  [/market|brand|advert/i, "bullhorn-outline"],
];

const iconForService = (name = "") => {
  const hit = TRADE_ICONS.find(([re]) => re.test(name));
  return hit ? hit[1] : "briefcase-outline";
};

/* ------------------------------------------------------------------ */
/* Animation helpers                                                   */
/* ------------------------------------------------------------------ */

function FadeIn({ delay = 0, style, children }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
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
                outputRange: [14, 0],
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

function SkeletonTile() {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skelTile, { opacity }]} />;
}

/* ------------------------------------------------------------------ */
/* Section pieces                                                      */
/* ------------------------------------------------------------------ */

const ServiceCard = memo(function ServiceCard({ node, index, onOpen }) {
  const tone = TONES[index % TONES.length];
  const children = node.children ?? [];
  const shown = children.slice(0, 2);
  const extra = children.length - shown.length;

  return (
    <PressScale
      onPress={() => onOpen(node)}
      style={styles.svcWrap}
      contentStyle={styles.svcCard}
      accessibilityLabel={`Browse ${node.ServiceName}`}
    >
      <View style={styles.svcTop}>
        <View style={[styles.svcIcon, { backgroundColor: tone.bg }]}>
          <MaterialCommunityIcons
            name={iconForService(node.ServiceName)}
            size={22}
            color={tone.fg}
          />
        </View>
        <View style={styles.arrowDot}>
          <MaterialCommunityIcons name="arrow-right" size={16} color={T.brand} />
        </View>
      </View>

      <Text style={styles.svcName} numberOfLines={2}>
        {node.ServiceName}
      </Text>

      {children.length > 0 ? (
        <View style={styles.chipCol}>
          {shown.map((child) => (
            <Pressable
              key={String(child.ServiceID)}
              onPress={() => onOpen(child)}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${child.ServiceName}`}
              style={({ pressed }) => [
                styles.chip,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.chipText} numberOfLines={1}>
                {child.ServiceName}
              </Text>
            </Pressable>
          ))}
          {extra > 0 && <Text style={styles.moreText}>+{extra} more</Text>}
        </View>
      ) : (
        <View style={styles.svcFooter}>
          <Text style={styles.svcHint}>Browse category</Text>
          <MaterialCommunityIcons name="arrow-right" size={15} color={T.brand} />
        </View>
      )}
    </PressScale>
  );
});

function SectionHeader({ title, count }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {typeof count === "number" && count > 0 && (
        <View style={styles.countPill}>
          <Text style={styles.countText}>
            {count} {count === 1 ? "category" : "categories"}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

const greetingFor = (hour) => {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function DashboardScreen() {
  const nav = useNavigation();
  const user = useAuthStore((s) => s.user);
  const unread = useNotificationsStore((s) => s.unreadCount());
  const selectCategory = useCategoryStore((s) => s.select);

  const role = String(user?.role ?? "")
    .trim()
    .toLowerCase();
  const userType = String(user?.userType ?? "")
    .trim()
    .toLowerCase();
  const isVendor =
    userType === "2" || userType === "commercial" || role === "commercial";
  const isAdmin = userType === "0" || userType === "admin" || role === "admin";
  const isIndividual = !isVendor && !isAdmin;

  // All hooks run before any early return.
  const servicesQuery = useQuery({
    queryKey: ["ServiceMenuGetList"],
    queryFn: fetchMenu,
    staleTime: 5 * 60 * 1000,
    enabled: isIndividual,
  });

  const serviceTree = useMemo(
    () => buildTree(servicesQuery.data ?? []),
    [servicesQuery.data],
  );

  const greeting = useMemo(() => greetingFor(new Date().getHours()), []);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const subtitle =
    [user?.city, user?.plan ? String(user.plan).toUpperCase() : null]
      .filter(Boolean)
      .join(" · ") || "India";

  const openService = useCallback(
    (service) => {
      selectCategory(service.ServiceID, [
        ...getAncestorIds(serviceTree, service.ServiceID),
      ]);
      const params = {
        serviceId: service.ServiceID,
        serviceName: service.ServiceName,
      };
      const drawerNav = nav.getParent();
      if (drawerNav) drawerNav.navigate("CompanySubServices", params);
      else nav.navigate("CompanySubServices", params);
    },
    [nav, selectCategory, serviceTree],
  );

  if (isVendor) return <VendorDashboardScreen />;
  if (isAdmin) return <AdminDashboardScreen />;

  const renderServices = () => {
    if (servicesQuery.isLoading) {
      return (
        <View style={styles.svcGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.svcWrap}>
              <SkeletonTile />
            </View>
          ))}
        </View>
      );
    }

    if (servicesQuery.isError) {
      return (
        <View style={styles.stateBox}>
          <View style={styles.stateIcon}>
            <MaterialCommunityIcons name="cloud-off-outline" size={22} color={T.faint} />
          </View>
          <Text style={styles.stateText}>Services could not be loaded.</Text>
          <PressScale
            onPress={() => servicesQuery.refetch()}
            contentStyle={styles.retryBtn}
          >
            <MaterialCommunityIcons name="refresh" size={15} color={T.brand} />
            <Text style={styles.retryText}>Try again</Text>
          </PressScale>
        </View>
      );
    }

    if (serviceTree.length === 0) {
      return (
        <View style={styles.stateBox}>
          <View style={styles.stateIcon}>
            <MaterialCommunityIcons name="layers-outline" size={22} color={T.faint} />
          </View>
          <Text style={styles.stateText}>No services available.</Text>
        </View>
      );
    }

    return (
      <View style={styles.svcGrid}>
        {serviceTree.map((node, index) => (
          <ServiceCard
            key={String(node.ServiceID)}
            node={node}
            index={index}
            onOpen={openService}
          />
        ))}
      </View>
    );
  };

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <PressScale
          onPress={() => nav.dispatch(DrawerActions.toggleDrawer())}
          style={styles.iconSlot}
          contentStyle={styles.iconBtn}
          accessibilityLabel="Open navigation menu"
        >
          <MaterialCommunityIcons name="menu" size={23} color={T.ink} />
        </PressScale>

        <View style={styles.greet}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {greeting}
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {firstName}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <PressScale
          onPress={() => nav.navigate(Routes.Notifications)}
          style={styles.iconSlot}
          contentStyle={styles.iconBtn}
          accessibilityLabel={
            unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
          }
        >
          <MaterialCommunityIcons name="bell-outline" size={21} color={T.ink} />
          {unread > 0 && <View style={styles.badgeDot} />}
        </PressScale>

        <PressScale
          onPress={() => nav.navigate(Routes.ProfileTab)}
          style={styles.iconSlot}
          contentStyle={styles.avatarWrap}
          accessibilityLabel="Open profile"
        >
          <Avatar name={user?.name ?? "U"} size={42} />
        </PressScale>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search */}
        <FadeIn>
          <PressScale
            onPress={() => nav.navigate(Routes.Search)}
            contentStyle={styles.searchBar}
            accessibilityLabel="Search services"
          >
            <MaterialCommunityIcons name="magnify" size={21} color={T.muted} />
            <Text style={styles.searchText} numberOfLines={1}>
              Search architects, contractors, materials…
            </Text>
          </PressScale>
        </FadeIn>

        {/* Credits */}
        <FadeIn delay={70}>
          <View style={styles.credit}>
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />

            <View style={styles.creditTop}>
              <View style={styles.creditIcon}>
                <MaterialCommunityIcons name="wallet-outline" size={18} color="#fff" />
              </View>
              <Text style={styles.creditLabel}>Available credits</Text>
            </View>

            <View style={styles.creditBottom}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.creditValue}>{user?.credits ?? 0}</Text>
                <Text style={styles.creditHint} numberOfLines={1}>
                  Unlock contacts and documents
                </Text>
              </View>
              <PressScale
                onPress={() => nav.navigate(Routes.PlansAndSubscriptionsScreen)}
                contentStyle={styles.creditCta}
                accessibilityLabel="Top up credits"
              >
                <MaterialCommunityIcons name="plus" size={17} color={T.brand} />
                <Text style={styles.creditCtaText}>Top up</Text>
              </PressScale>
            </View>
          </View>
        </FadeIn>

        {/* Services */}
        <FadeIn delay={140}>
          <SectionHeader title="Browse services" count={serviceTree.length} />
          {renderServices()}
        </FadeIn>

        {/* Verified companies (individual users) */}
        {isIndividual && (
          <FadeIn delay={200}>
            <CompanyPreview
              onViewMore={() => nav.navigate(Routes.CompanyListScreen)}
            />
          </FadeIn>
        )}

        {/* Vendor upsell */}
        <FadeIn delay={260}>
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <MaterialCommunityIcons name="rocket-launch-outline" size={21} color={T.amberInk} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Badge label="For vendors" tone="accent" />
              <Text style={styles.bannerTitle}>
                Get qualified leads. Daily.
              </Text>
              <Text style={styles.bannerBody}>
                Upgrade to Commercial Pro to list unlimited services and feature
                your business.
              </Text>
            </View>
            <PressScale
              onPress={() => nav.navigate(Routes.Plans)}
              contentStyle={styles.bannerCta}
              accessibilityLabel="Explore plans"
            >
              <Text style={styles.bannerCtaText}>Plans</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#fff" />
            </PressScale>
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
  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  greet: { flex: 1, minWidth: 0 },
  eyebrow: { color: T.muted, fontSize: 12, fontWeight: "600" },
  name: {
    color: T.ink,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: 1,
  },
  subtitle: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
    letterSpacing: 0.3,
  },
  iconSlot: { width: 44, height: 44 },
  iconBtn: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.danger,
    borderWidth: 1.5,
    borderColor: T.surface,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },

  /* Search */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    backgroundColor: T.surface,
    ...SHADOW,
  },
  searchText: { flex: 1, color: T.faint, fontSize: 14, fontWeight: "500" },

  /* Credits */
  credit: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: T.brand,
    overflow: "hidden",
    shadowColor: T.brand,
    shadowOpacity: 0.47,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  glowTop: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -80,
    right: -50,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  glowBottom: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -60,
    left: -30,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  creditTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  creditIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  creditLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  creditBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginTop: 14,
  },
  creditValue: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  creditHint: { color: "rgba(255,255,255,0.72)", fontSize: 12, marginTop: 2 },
  creditCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },
  creditCtaText: { color: T.brand, fontSize: 13, fontWeight: "800" },

  /* Section header */
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: T.ink,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  countPill: {
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: T.indigoSoft,
  },
  countText: { color: T.brand, fontSize: 11, fontWeight: "800" },

  /* Service grid */
  svcGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  svcWrap: { width: "48%", marginBottom: 12 },
  svcCard: {
    padding: 14,
    minHeight: 172,
    borderRadius: 18,
    backgroundColor: T.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line,
    gap: 10,
    overflow: "hidden",
    ...SHADOW,
  },
  svcTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  svcIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowDot: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  svcName: {
    color: T.ink,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
    minHeight: 38,
  },
  chipCol: { gap: 4, alignItems: "flex-start" },
  chip: {
    maxWidth: "100%",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  chipText: { color: T.body, fontSize: 11, fontWeight: "600" },
  moreText: { color: T.brand, fontSize: 11, fontWeight: "700", marginTop: 2 },
  svcFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  svcHint: { color: T.brand, fontSize: 11, fontWeight: "700" },
  skelTile: {
    height: 172,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },

  /* States */
  stateBox: { alignItems: "center", gap: 8, paddingVertical: spacing.xl },
  stateIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: T.slateSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: { color: T.muted, fontSize: 13, fontWeight: "600" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: T.indigoSoft,
  },
  retryText: { color: T.brand, fontSize: 13, fontWeight: "800" },

  /* Vendor banner */
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: T.amberSoft,
    borderWidth: 1,
    borderColor: T.amberLine,
  },
  bannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: { color: T.ink, fontSize: 15, fontWeight: "800", marginTop: 6 },
  bannerBody: { color: T.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  bannerCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: T.brand,
  },
  bannerCtaText: { color: "#fff", fontSize: 12, fontWeight: "800" },
});
