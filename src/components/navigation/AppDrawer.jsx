// src/components/navigation/AppDrawer.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { UserRegistrationUserIdGet } from "../../api/api";
import CategorySidebar from "./CategorySidebar";
import MainTabs from "@/navigation/MainTabs";
import CompanySubServices from "@/screens/public/CompanySubServices";
import PlansAndSubscriptionsScreen from "@/screens/plans/PlansAndSubscriptionsScreen";

/* ─────────────────────────────── constants ─────────────────────────────── */

const C = {
  purple1: "#7B2FBE",
  purple2: "#5B21B6",
  purpleHero: "#4C1D95",
  purpleSoft: "#EDE9FE",
  purpleLight: "#F5F3FF",
  purpleAccent: "#8B5CF6",
  ink: "#1E293B",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  canvas: "#FAFAFA",
  surface: "#FFFFFF",
  red: "#DC2626",
  redLight: "#FEF2F2",
  redLine: "#FECACA",
};

/* NAV items mapped to your existing routes */
const NAV_MAIN = [
  { key: "profile",   label: "Profile",    icon: "person-outline",        route: "ProfileTab" },
//   { key: "messages",  label: "Messages",   icon: "chatbubble-outline",    route: "ChatList" },
  { key: "activity",  label: "Activity",   icon: "pulse-outline",         route: "LeadsTab" },
  { key: "lists",     label: "Services",   icon: "list-outline",          route: "CompanySubServices", expandable: true },
  { key: "reports",   label: "Reports",    icon: "bar-chart-outline",     route: "Analytics" },
  { key: "plans",     label: "Plans",      icon: "trending-up-outline",   route: "PlansAndSubscriptionsScreen" },
  { key: "signout",   label: "Sign Out",   icon: "log-out-outline",       isLogout: true },
];

const NAV_SECONDARY = [
  { key: "share",     label: "Tell a Friend",    icon: "share-social-outline", route: null },
  { key: "help",      label: "Help & Feedback",  icon: "help-circle-outline",  route: "FAQ" },
];

/* ─────────────────────────────── drawer content ─────────────────────────── */

function DrawerContent({ navigation, state }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activePanel, setActivePanel] = useState("menu");

  const user      = useAuthStore((s) => s.user);
  const signOut   = useAuthStore((s) => s.signOut);
  const userId    = user?.userId;
  const userName  = user?.userName || "User";

  /* animated values */
  const headerScale  = useRef(new Animated.Value(0.92)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const listAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(listAnim,  { toValue: 1, duration: 420, delay: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["UserData", userId],
    queryFn: async () => {
      const res = await UserRegistrationUserIdGet(userId);
      return res?.data?.[0] ?? {};
    },
    enabled: !!userId,
    retry: false,
  });

  const displayName = profile?.Name || userName || "User";
  const activeRoute = state?.routes?.[state?.index]?.name ?? "";

  const close = () => {
    navigation.dispatch(DrawerActions.closeDrawer());
  };
  const go = (route, params) => {
    if (!route) return;
    close();
    const tabRoutes = [
      "ProfileTab",
      "LeadsTab",
      "IndividualMyServicesScreen",
      "PlansAndSubscriptionsScreen",
      "CompanyListScreen",
    ];
    if (tabRoutes.includes(route)) {
      navigation.navigate("Home", { screen: route, params });
      return;
    }
    navigation.navigate(route, params);
  };

  const confirmLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => { close(); queryClient.clear(); await signOut(); },
      },
    ]);
  };

  const initials = displayName.charAt(0).toUpperCase();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Purple header ── */}
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        {/* close button */}
        <Pressable onPress={close} style={styles.closeBtn} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close drawer">
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>

        {/* avatar + name */}
        <View style={styles.profileRow}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.profileName}>{displayName}</Text>
            {!!user?.email && (
              <Text style={styles.profileSub} numberOfLines={1}>{user.email}</Text>
            )}
          </View>
        </View>

        {/* decorative diamonds */}
        <View pointerEvents="none" style={styles.diamond1} />
        <View pointerEvents="none" style={styles.diamond2} />
        <View pointerEvents="none" style={styles.diamond3} />
      </Animated.View>

      <View style={styles.panelTabs}>
        {[
          { key: "menu", label: "Menu", icon: "menu-outline" },
          { key: "Services", label: "Services", icon: "grid-outline" },
        ].map((panel) => {
          const selected = activePanel === panel.key;
          return (
            <Pressable
              key={panel.key}
              onPress={() => setActivePanel(panel.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[styles.panelTab, selected && styles.panelTabActive]}
            >
              <Ionicons
                name={panel.icon}
                size={15}
                color={selected ? C.purple2 : C.muted}
              />
              <Text style={[styles.panelTabText, selected && styles.panelTabTextActive]}>
                {panel.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activePanel === "Services" ? (
        <CategorySidebar navigation={navigation} />
      ) : (
        <Animated.View style={{ flex: 1, opacity: listAnim }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.navList}>
            {NAV_MAIN.map((item) => {
              if (item.isLogout) {
                return (
                  <NavItem
                    key={item.key}
                    item={item}
                    active={false}
                    onPress={confirmLogout}
                  />
                );
              }
              const isActive = activeRoute === item.route;
              return (
                <NavItem
                  key={item.key}
                  item={item}
                  active={isActive}
                  onPress={() =>
                    item.expandable
                      ? setActivePanel("Services")
                      : go(item.route)
                  }
                  expanded={item.expandable && activePanel === "Services"}
                />
              );
            })}

            <View style={styles.divider} />

            {NAV_SECONDARY.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                active={false}
                onPress={() => go(item.route)}
                secondary
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* ── Footer safe area ── */}
      <View style={{ height: insets.bottom + 8 }} />
    </View>
  );
}

/* ─── single nav row ─── */
function NavItem({ item, active, onPress, secondary, expanded }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn  = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: active }}
    >
      <Animated.View
        style={[
          styles.navRow,
          active && styles.navRowActive,
          secondary && styles.navRowSecondary,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
          <Ionicons
            name={item.icon}
            size={18}
            color={active ? C.purpleAccent : secondary ? C.faint : C.muted}
          />
        </View>
        <Text
          style={[
            styles.navLabel,
            active && styles.navLabelActive,
            secondary && styles.navLabelSecondary,
          ]}
        >
          {item.label}
        </Text>
        {!secondary && (
          <Ionicons
            name={item.expandable ? (expanded ? "chevron-up" : "chevron-down") : "chevron-forward"}
            size={16}
            color={active ? C.purpleAccent : C.faint}
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

/* ─────────────────────────────── navigator ─────────────────────────────── */

function CompanySubServicesRoute({ route }) {
  return (
    <CompanySubServices
      serviceId={route.params?.serviceId}
      serviceName={route.params?.serviceName}
    />
  );
}

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  const { width } = useWindowDimensions();
  const isTablet  = width >= 900;

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: isTablet ? "permanent" : "slide",
        drawerStyle: {
          width: isTablet ? 300 : 295,
          backgroundColor: C.surface,
        },
        overlayColor: "rgba(15, 23, 42, 0.45)",
        swipeEdgeWidth: 40,
      }}
    >
      <Drawer.Screen name="Home" component={MainTabs} />
      <Drawer.Screen
        name="CompanySubServices"
        component={CompanySubServicesRoute}
        options={{ title: "Our Services" }}
      />
      <Drawer.Screen
        name="PlansAndSubscriptions"
        component={PlansAndSubscriptionsScreen}
        options={{ title: "Plans & Subscriptions" }}
      />
    </Drawer.Navigator>
  );
}

/* ─────────────────────────────── styles ─────────────────────────────── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },

  /* header */
  header: {
    height: 200,
    backgroundColor: C.purple2,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileRow: { alignItems: "flex-start" },
  avatarOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    zIndex: 2,
    elevation: 2,
    marginBottom: 2,
  },
  panelTabs: {
    flexDirection: "row",
    gap: 4,
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: C.purpleLight,
    borderWidth: 1,
    borderColor: C.purpleSoft,
  },
  panelTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 38,
    borderRadius: 9,
  },
  panelTabActive: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.purpleSoft,
    elevation: 1,
  },
  panelTabText: { color: C.muted, fontSize: 12, fontWeight: "700" },
  panelTabTextActive: { color: C.purple2, fontWeight: "800" },
  avatarInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#fff", fontSize: 26, fontWeight: "800" },
  profileName: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: 0.2 },
  profileSub:  { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },

  /* decorative polygon shapes like the reference image */
  diamond1: {
    position: "absolute", top: -30, right: -20,
    width: 110, height: 110,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    transform: [{ rotate: "40deg" }],
  },
  diamond2: {
    position: "absolute", top: 40, right: 50,
    width: 80, height: 80,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    transform: [{ rotate: "20deg" }],
  },
  diamond3: {
    position: "absolute", bottom: -20, right: -10,
    width: 100, height: 100,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.07)",
    transform: [{ rotate: "55deg" }],
  },

  /* nav list */
  navList: { paddingVertical: 10, paddingHorizontal: 12 },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginVertical: 1,
  },
  navRowActive: {
    backgroundColor: C.purpleSoft,
  },
  navRowSecondary: {
    marginTop: 2,
  },

  navIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.canvas,
  },
  navIconWrapActive: {
    backgroundColor: C.purpleLight,
  },

  navLabel: { flex: 1, color: C.ink, fontSize: 15, fontWeight: "600" },
  navLabelActive: { color: C.purpleAccent, fontWeight: "700" },
  navLabelSecondary: { color: C.muted, fontSize: 14 },

  divider: {
    height: 1,
    backgroundColor: C.line,
    marginVertical: 14,
    marginHorizontal: 4,
  },
});