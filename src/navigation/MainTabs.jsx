import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Routes } from "@/constants/routes";
import { useAuthStore } from "@/store/authStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import DashboardScreen from "@/screens/dashboard/DashboardScreen";
import LeadInboxScreen from "@/screens/leads/LeadInboxScreen";
import ProfileScreen from "@/screens/profile/ProfileScreen";
import PlansAndSubscriptionsScreen from "../screens/plans/PlansAndSubscriptionsScreen";
import IndividualMyServicesScreen from "../screens/Individual/IndividualMyServices";
import CompanyListScreen from "../screens/companies/CompanyListScreen";

const Tab = createBottomTabNavigator();

/* ------------------------------------------------------------------ */
/* Solid controls sit over a lightly translucent glass surface.       */
/* ------------------------------------------------------------------ */

const C = {
  purple: "#7C3AED",
  purpleDark: "#5B21B6",
  surface: "#F1F5FB",
  glass: "rgba(241, 245, 251, 0.72)",
  canvas: "#F8FAFC",
  muted: "#94A3B8",
  line: "#E2E8F0",
  danger: "#EF4444",
};

const TAB_H = 64;     // height of the pill itself
const FAB_SIZE = 58;
const FAB_LIFT = 18;  // how far the FAB rises above the pill
const MIN_BOTTOM = 10;

/* ------------------------------------------------------------------ */
/* Icons per route                                                     */
/* ------------------------------------------------------------------ */

const ICON_MAP = {
  [Routes.HomeTab]: { active: "home", inactive: "home-outline" },
  [Routes.LeadsTab]: { active: "megaphone", inactive: "megaphone-outline" },
  [Routes.IndividualMyServicesScreen]: { active: "briefcase", inactive: "briefcase-outline" },
  [Routes.CompanyListScreen]: { active: "business", inactive: "business-outline" },
  [Routes.ProfileTab]: { active: "person-circle", inactive: "person-circle-outline" },
};

/* ------------------------------------------------------------------ */
/* Custom tab bar                                                      */
/* The bar is a normal flex child of the navigator, so the scene area  */
/* above it is sized to end where the bar starts. Nothing scrolls      */
/* underneath it.                                                      */
/* ------------------------------------------------------------------ */

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, MIN_BOTTOM);

  return (
    // Opaque wrapper. It covers the gesture-bar inset as well as the pill.
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;
          const badge = options.tabBarBadge;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (options.isFab === true) {
            return (
              <FabButton
                key={route.key}
                label={label}
                isFocused={isFocused}
                badge={badge}
                onPress={onPress}
              />
            );
          }

          return (
            <TabButton
              key={route.key}
              label={label}
              routeName={route.name}
              isFocused={isFocused}
              badge={badge}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

/* ---------- Regular tab ---------- */

function TabButton({ label, routeName, isFocused, badge, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isFocused ? 1.08 : 1,
      useNativeDriver: true,
      tension: 140,
      friction: 8,
    }).start();
  }, [isFocused, scale]);

  const icons = ICON_MAP[routeName] ?? { active: "ellipse", inactive: "ellipse-outline" };

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      hitSlop={6}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
          <Ionicons
            name={isFocused ? icons.active : icons.inactive}
            size={21}
            color={isFocused ? C.purple : C.muted}
          />
          <Badge count={badge} />
        </View>
        <Text
          style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ---------- Centre FAB ---------- */

function FabButton({ label, isFocused, badge, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <View style={styles.fabSlot}>
      {/* Opaque ring that sits behind the FAB and cuts the pill's edge */}
      <View style={styles.fabRing} pointerEvents="none" />
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isFocused }}
        style={styles.fabHit}
      >
        <Animated.View
          style={[
            styles.fab,
            isFocused && styles.fabActive,
            { transform: [{ translateY: -FAB_LIFT }, { scale }] },
          ]}
        >
          <Ionicons name="flash" size={26} color="#fff" />
          <Badge count={badge} />
        </Animated.View>
      </Pressable>
      <Text style={[styles.fabLabel, isFocused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* ---------- Badge ---------- */

function Badge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Navigator                                                           */
/* ------------------------------------------------------------------ */

export default function MainTabs() {
  const role = useAuthStore((s) => s.user?.userType ?? s.user?.role);
  const unread = useNotificationsStore(
    (s) => s.items.filter((item) => item.type === "message" && !item.read).length,
  );

  const isAdmin = role == "0" || role == "admin";

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      sceneContainerStyle={styles.scene}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name={Routes.HomeTab} component={DashboardScreen} options={{ title: "Home" }} />

      {!isAdmin && (
        <>
          {role == 1 ? (
            <Tab.Screen
              name={Routes.IndividualMyServicesScreen}
              component={IndividualMyServicesScreen}
              options={{ title: "Services" }}
            />
          ) : (
            <Tab.Screen
              name={Routes.LeadsTab}
              component={LeadInboxScreen}
              options={{ title: "Leads" }}
            />
          )}

          <Tab.Screen
            name={Routes.PlansAndSubscriptionsScreen}
            component={PlansAndSubscriptionsScreen}
            options={{
              title: "Plans",
              isFab: true,
              tabBarBadge: unread > 0 ? unread : undefined,
            }}
          />

          <Tab.Screen
            name={Routes.CompanyListScreen}
            component={CompanyListScreen}
            options={{ title: "Companies" }}
          />
        </>
      )}

      <Tab.Screen name={Routes.ProfileTab} component={ProfileScreen} options={{ title: "Me" }} />
    </Tab.Navigator>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  scene: { backgroundColor: C.canvas },

  /* The bar reserves scene space while its glass tint reveals the    */
  /* navigator background.                                            */
  bar: {
    backgroundColor: C.glass,
    paddingTop: FAB_LIFT,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 12 },
    }),
  },

  pill: {
    height: TAB_H,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: C.glass,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    paddingHorizontal: 4,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  /* Regular tabs */
  tab: {
    flex: 1,
    height: TAB_H,
    alignItems: "center",
    justifyContent: "center",
  },
  tabInner: { alignItems: "center" },
  iconWrap: {
    width: 42,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: { backgroundColor: "#F3E8FF" },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: C.muted,
    marginTop: 2,
  },
  tabLabelActive: { color: C.purple, fontWeight: "700" },

  /* FAB. The slot is as tall as the pill, the FAB lifts out of it. */
  fabSlot: {
    width: FAB_SIZE + 24,
    height: TAB_H,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  fabRing: {
    position: "absolute",
    top: -FAB_LIFT + 0,
    width: FAB_SIZE + 12,
    height: FAB_SIZE + 12,
    borderRadius: (FAB_SIZE + 12) / 2,
    backgroundColor: C.glass,
  },
  fabHit: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    marginTop: -FAB_LIFT,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: C.purple,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 10 },
    }),
  },
  fabActive: { backgroundColor: C.purpleDark },
  fabLabel: {
    position: "absolute",
    bottom: 6,
    fontSize: 10,
    fontWeight: "600",
    color: C.muted,
  },

  /* Badge */
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: C.danger,
    borderWidth: 1.5,
    borderColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
});