import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Platform,
  Pressable,
} from "react-native";
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

/* ─────────────────────────────── palette ─────────────────────────────── */

const C = {
  purple:     "#7C3AED",
  purpleDark: "#5B21B6",
  surface:    "#FFFFFF",
  muted:      "#94A3B8",
  line:       "#E2E8F0",
};

const TAB_H    = 68;   // tab bar visual height
const FAB_SIZE = 58;   // floating action button diameter

/* ─────────────────────────────── icon lookup ─────────────────────────── */

const ICON_MAP = {
  [Routes.HomeTab]:                    { active: "home",         inactive: "home-outline" },
  [Routes.LeadsTab]:                   { active: "megaphone",    inactive: "megaphone-outline" },
  [Routes.IndividualMyServicesScreen]: { active: "briefcase",    inactive: "briefcase-outline" },
  [Routes.PlansAndSubscriptionsScreen]:{ active: "flash",        inactive: "flash-outline" },
  [Routes.CompanyListScreen]:          { active: "business",     inactive: "business-outline" },
  [Routes.ProfileTab]:                 { active: "person-circle",inactive: "person-circle-outline" },
};

/* ─────────────────────────────── custom tab bar ─────────────────────────── */

function CustomTabBar({ state, descriptors, navigation }) {
  const insets    = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.barWrapper, { paddingBottom: bottomPad }]}>
      <View style={styles.barCard}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label       = options.title ?? route.name;
          const isFocused   = state.index === index;
          const isFab       = options.isFab === true;
          const badge       = options.tabBarBadge;

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

          if (isFab) {
            return (
              <FabButton
                key={route.key}
                label={label}
                isFocused={isFocused}
                onPress={onPress}
                routeName={route.name}
              />
            );
          }

          return (
            <TabButton
              key={route.key}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
              routeName={route.name}
              badge={badge}
            />
          );
        })}
      </View>
    </View>
  );
}

/* ─── regular tab button ─── */
function TabButton({ label, isFocused, onPress, routeName, badge }) {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.12 : 1,
        useNativeDriver: true,
        tension: 130,
        friction: 6,
      }),
      Animated.timing(dotOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const icons = ICON_MAP[routeName] ?? { active: "ellipse", inactive: "ellipse-outline" };

  return (
    <Pressable
      style={styles.tabBtn}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={{ alignItems: "center", transform: [{ scale: scaleAnim }] }}>
        <View style={styles.tabIconWrap}>
          <Ionicons
            name={isFocused ? icons.active : icons.inactive}
            size={22}
            color={isFocused ? C.purple : C.muted}
          />
          {!!badge && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {label}
        </Text>
      </Animated.View>
      {/* active indicator dot */}
      {/* <Animated.View style={[styles.activeDot, { opacity: dotOpacity }]} /> */}
    </Pressable>
  );
}

/* ─── floating action button (centre) ─── */
function FabButton({ label, onPress, isFocused }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 1400, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleIn  = () =>
    Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, speed: 60 }).start();
  const handleOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 60 }).start();

  return (
    <View style={styles.fabContainer}>
      {/* pulse ring */}
      <Animated.View style={[styles.fabPulse, { transform: [{ scale: pulseAnim }] }]} />
      <Pressable
        onPress={onPress}
        onPressIn={handleIn}
        onPressOut={handleOut}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Animated.View
          style={[
            styles.fab,
            isFocused && styles.fabActive,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Ionicons name="flash" size={26} color="#fff" />
        </Animated.View>
      </Pressable>
      <Text style={[styles.fabLabel, isFocused && styles.fabLabelActive]}>{label}</Text>
    </View>
  );
}

/* ─────────────────────────────── main tabs ─────────────────────────────── */

export default function MainTabs() {
  const role   = useAuthStore((s) => s.user?.userType ?? s.user?.role);
  const unread = useNotificationsStore(
    (s) => s.items.filter((item) => item.type === "message" && !item.read).length,
  );

  const isAdmin = role == "0" || role == "admin";

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* ── Home ── */}
      <Tab.Screen
        name={Routes.HomeTab}
        component={DashboardScreen}
        options={{ title: "Home" }}
      />

      {!isAdmin ? (
        <>
          {/* ── Role-based second tab ── */}
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

          {/* ── Centre FAB ── */}
          <Tab.Screen
            name={Routes.PlansAndSubscriptionsScreen}
            component={PlansAndSubscriptionsScreen}
            options={{
              title: "Plans",
              isFab: true,
              tabBarBadge: unread > 0 ? unread : undefined,
            }}
          />

          {/* ── Companies ── */}
          <Tab.Screen
            name={Routes.CompanyListScreen}
            component={CompanyListScreen}
            options={{ title: "Companies" }}
          />
        </>
      ) : null}

      {/* ── Profile ── */}
      <Tab.Screen
        name={Routes.ProfileTab}
        component={ProfileScreen}
        options={{ title: "Me" }}
      />
    </Tab.Navigator>
  );
}

/* ─────────────────────────────── styles ─────────────────────────────── */

const styles = StyleSheet.create({
  /* wrapper sits at bottom of the screen */
  barWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 12,
  },

  /* the white rounded pill card */
  barCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    height: TAB_H,
    backgroundColor: C.surface,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#1E293B",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
      android: { elevation: 16 },
    }),
  },

  /* ── regular tab ── */
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: TAB_H,
  },
  tabIconWrap: {
    position: "relative",
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: C.muted,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: C.purple,
    fontWeight: "700",
  },
  activeDot: {
    position: "absolute",
    bottom: 7,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.purple,
  },

  /* badge */
  badge: {
    position: "absolute",
    top: -3,
    right: -7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: C.surface,
  },
  badgeText: { color: "#fff", fontSize: 8, fontWeight: "900" },

  /* ── FAB ── */
  fabContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -(FAB_SIZE / 2 + 6),
    width: FAB_SIZE + 20,
  },
  fabPulse: {
    position: "absolute",
    width: FAB_SIZE + 18,
    height: FAB_SIZE + 18,
    borderRadius: (FAB_SIZE + 18) / 2,
    backgroundColor: "rgba(124, 58, 237, 0.14)",
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
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: { elevation: 14 },
    }),
  },
  fabActive: {
    backgroundColor: C.purpleDark,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.muted,
    marginTop: 5,
  },
  fabLabelActive: {
    color: C.purple,
  },

});
