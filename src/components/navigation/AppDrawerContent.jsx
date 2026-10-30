import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import CategorySidebar from "./CategorySidebar";
import { UserRegistrationUserIdGet } from "../../api/api";
import { fetchMenu } from "../../utils/serviceData";

/* ------------------------------------------------------------------ */
/* Config: route names must match your navigators                      */
/* ------------------------------------------------------------------ */

const NAV = [
  { key: "home", label: "Home", icon: "home-outline", route: "Home" },
  {
    key: "about",
    label: "About",
    icon: "information-circle-outline",
    route: "About",
  },
  {
    key: "services",
    label: "Our Services",
    icon: "grid-outline",
    expandable: true,
  },
  {
    key: "companies",
    label: "Verified Companies",
    icon: "shield-checkmark-outline",
    route: "CompanyList",
  },
  {
    key: "projects",
    label: "Projects",
    icon: "construct-outline",
    route: "Projects",
  },
  {
    key: "contact",
    label: "Contact Us",
    icon: "call-outline",
    route: "Contact",
  },
];

// userType: 0 = admin, 1 = individual, 2 = commercial (same as the web header)
const DASHBOARD_BY_TYPE = {
  0: "AdminDashboard",
  1: "IndividualDashboard",
  2: "CommercialDashboard",
};

const C = {
  brand: "#162646",
  ink: "#1E293B",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  canvas: "#F8FAFC",
  surface: "#FFFFFF",
  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  red: "#DC2626",
  redLight: "#FEF2F2",
  redLine: "#FECACA",
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AppDrawerContent({ navigation, state }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("menu");
  const [servicesOpen, setServicesOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const userId = user?.userId;
  const userType = Number(user?.userType ?? -1);

  const { data: profile } = useQuery({
    queryKey: ["UserData", userId],
    queryFn: async () => {
      const res = await UserRegistrationUserIdGet(userId);
      return res?.data?.[0] ?? {};
    },
    enabled: !!userId,
    retry: false,
  });

  const { data: menu = [] } = useQuery({
    queryKey: ["ServiceMenuGetList"],
    queryFn: fetchMenu,
    staleTime: 5 * 60 * 1000,
  });

  // Same rule as the web mega menu: top-level services only.
  const rootServices = useMemo(
    () =>
      menu
        .filter((s) => Number(s?.ParentServiceID ?? 0) === 0)
        .map((s) => ({ id: s.ServiceID, name: s.ServiceName || "Service" })),
    [menu],
  );

  const activeRoute = state?.routes?.[state?.index]?.name;

  const close = () => navigation.dispatch(DrawerActions.closeDrawer());

  const go = (route, params) => {
    if (!route) return;
    close();
    navigation.navigate(route, params);
  };

  const goDashboard = () => go(DASHBOARD_BY_TYPE[userType] ?? "Home");

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          close();
          queryClient.clear();
          // RootNavigator switches to the auth stack once the user is cleared.
          await logout();
        },
      },
    ]);
  };

  const displayName = profile?.Name || "User";

  return (
    <View style={styles.root}>
      {/* Brand block */}
      <View style={[styles.brand, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brandTop}>
          <Pressable
            onPress={close}
            hitSlop={10}
            style={styles.closeBtn}
            accessibilityLabel="Close menu"
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.brandRow}>
          <Image
            source={require("@/assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.brandTitle}>Contracts India™</Text>
            <Text style={styles.brandSub} numberOfLines={2}>
              Integrated Solution For Construction & Infrastructure
            </Text>
          </View>
        </View>

        {!!userId && (
          <View style={styles.welcome}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.welcomeLabel}>Welcome</Text>
              <Text style={styles.welcomeName} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: "menu", label: "Menu", icon: "menu-outline" },
          { key: "Services", label: "Services", icon: "layers-outline" },
        ].map((t) => {
          const on = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[styles.tab, on && styles.tabOn]}
            >
              <Ionicons
                name={t.icon}
                size={15}
                color={on ? C.primary : C.muted}
              />
              <Text style={[styles.tabText, on && { color: C.primary }]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Body */}
      <View style={styles.body}>
        {tab === "menu" ? (
          <ScrollView
            contentContainerStyle={styles.menu}
            showsVerticalScrollIndicator={false}
          >
            {NAV.map((item) => {
              if (item.expandable) {
                return (
                  <View key={item.key}>
                    <Pressable
                      onPress={() => setServicesOpen((o) => !o)}
                      style={({ pressed }) => [
                        styles.navRow,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                    >
                      <View style={styles.navIcon}>
                        <Ionicons
                          name={item.icon}
                          size={17}
                          color={C.primary}
                        />
                      </View>
                      <Text style={styles.navLabel}>{item.label}</Text>
                      <Ionicons
                        name={servicesOpen ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={C.faint}
                      />
                    </Pressable>

                    {servicesOpen && (
                      <View style={styles.subList}>
                        {rootServices.length === 0 ? (
                          <Text style={styles.empty}>
                            No services available.
                          </Text>
                        ) : (
                          rootServices.map((s) => (
                            <Pressable
                              key={String(s.id)}
                              onPress={() =>
                                go("CompanySubServices", {
                                  serviceId: s.id,
                                  serviceName: s.name,
                                })
                              }
                              style={({ pressed }) => [
                                styles.subRow,
                                pressed && styles.pressed,
                              ]}
                            >
                              <View style={styles.dot} />
                              <Text style={styles.subLabel} numberOfLines={1}>
                                {s.name}
                              </Text>
                            </Pressable>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                );
              }

              const on = activeRoute === item.route;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => go(item.route)}
                  style={({ pressed }) => [
                    styles.navRow,
                    on && styles.navRowOn,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="link"
                >
                  <View
                    style={[
                      styles.navIcon,
                      on && { backgroundColor: C.primary },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={17}
                      color={on ? "#fff" : C.primary}
                    />
                  </View>
                  <Text style={[styles.navLabel, on && { color: C.primary }]}>
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={C.faint} />
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <CategorySidebar />
        )}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={goDashboard}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.85 },
          ]}
          accessibilityRole="button"
        >
          <Ionicons name="grid-outline" size={16} color="#fff" />
          <Text style={styles.primaryText}>Dashboard</Text>
        </Pressable>
        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && { opacity: 0.85 },
          ]}
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={16} color={C.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  pressed: { opacity: 0.8 },

  brand: {
    backgroundColor: C.brand,
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 14,
  },
  brandTop: { flexDirection: "row", justifyContent: "flex-end" },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff" },
  brandTitle: { color: "#fff", fontSize: 17, fontWeight: "900" },
  brandSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },

  welcome: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  welcomeLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
  },
  welcomeName: { color: "#fff", fontSize: 13, fontWeight: "800", marginTop: 1 },

  tabs: {
    flexDirection: "row",
    gap: 6,
    margin: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 36,
    borderRadius: 11,
  },
  tabOn: { backgroundColor: C.surface, elevation: 1 },
  tabText: { color: C.muted, fontSize: 12, fontWeight: "800" },

  body: { flex: 1 },
  menu: { padding: 10, paddingTop: 0, gap: 4 },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  navRowOn: { backgroundColor: C.primaryLight },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: { flex: 1, color: C.ink, fontSize: 14, fontWeight: "700" },

  subList: {
    marginLeft: 26,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: C.line,
    gap: 2,
    marginBottom: 4,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 40,
    paddingHorizontal: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  subLabel: { flex: 1, color: C.muted, fontSize: 13, fontWeight: "600" },
  empty: { color: C.faint, fontSize: 12, paddingVertical: 8 },

  footer: {
    gap: 10,
    padding: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
    backgroundColor: C.canvas,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.brand,
  },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.redLine,
    backgroundColor: C.redLight,
  },
  logoutText: { color: C.red, fontSize: 14, fontWeight: "800" },
});
