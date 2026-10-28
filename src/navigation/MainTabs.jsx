import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Routes } from "@/constants/routes";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import DashboardScreen from "@/screens/dashboard/DashboardScreen";
import CategoriesScreen from "@/screens/marketplace/CategoriesScreen";
import LeadInboxScreen from "@/screens/leads/LeadInboxScreen";
import ChatListScreen from "@/screens/chat/ChatListScreen";
import ProfileScreen from "@/screens/profile/ProfileScreen";
import PlansAndSubscriptionsScreen from "../screens/plans/PlansAndSubscriptionsScreen";
import IndividualMyServicesScreen from "../screens/Individual/IndividualMyServices";
const Tab = createBottomTabNavigator();
export default function MainTabs() {
  const role = useAuthStore((s) => s.user?.userType ?? s.user?.role);
  const unread = useNotificationsStore(
    (s) =>
      s.items.filter((item) => item.type === "message" && !item.read).length,
  );
  console.log( role ,"rolerole");
  
  const isAdmin = role == "0" || role == "admin";
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => {
          const map = {
            [Routes.HomeTab]: "home-outline",
            [Routes.MarketplaceTab]: "grid-outline",
            [Routes.LeadsTab]: "megaphone-outline",
            [Routes.PlansAndSubscriptionsScreen]: "card-outline",
            [Routes.ProfileTab]: "person-outline",
          };
          return (
            <Ionicons
              name={map[route.name] ?? "ellipse-outline"}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name={Routes.HomeTab}
        component={DashboardScreen}
        options={{ title: "Home" }}
      />
      {!isAdmin ? (
        <>
          <Tab.Screen
            name={Routes.MarketplaceTab}
            component={CategoriesScreen}
            options={{ title: "Marketplace" }}
          />
          {role == 1 ? (
             <Tab.Screen
              name={Routes.IndividualMyServicesScreen}
              component={IndividualMyServicesScreen}
              options={{ title: "My Services" }}
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
              title: "Plans & Subscriptions",
              tabBarBadge: unread > 0 ? unread : undefined,
            }}
          />
        </>
      ) : null}
      <Tab.Screen
        name={Routes.ProfileTab}
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}
