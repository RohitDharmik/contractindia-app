import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Routes } from "@/constants/routes";
import GuestLandingScreen from "@/screens/guest/GuestLandingScreen";
import GuestAccountScreen from "@/screens/guest/GuestAccountScreen";
import SearchScreen from "@/screens/marketplace/SearchScreen";
import CompanyListScreen from "@/screens/companies/CompanyListScreen";
import CompanyDetailScreen from "@/screens/companies/CompanyDetailScreen";
import CompanySubServices from "@/screens/public/CompanySubServices";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/constants/colors";
import { globalStackScreenOptions } from "./stackOptions";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function GuestTabIcon({ icon, focused, color, size }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.spring(scale, {
      toValue: focused ? 1.08 : 1,
      useNativeDriver: true,
      tension: 140,
      friction: 8,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={icon} size={size} color={color} />
    </Animated.View>
  );
}

function GuestTabs() {
  return (
    <>
      <StatusBar style="dark" />
      <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: colors.bg }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            height: 62,
            paddingTop: 6,
            paddingBottom: 8,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
          tabBarIcon: ({ color, size, focused }) => {
            const icons = {
              [Routes.GuestHome]: focused ? "home" : "home-outline",
              [Routes.GuestCategories]: focused ? "grid" : "grid-outline",
              [Routes.GuestCompanies]: focused ? "business" : "business-outline",
              [Routes.GuestAccount]: focused ? "person" : "person-outline",
            };
            return (
              <GuestTabIcon
                icon={icons[route.name]}
                focused={focused}
                size={size}
                color={color}
              />
            );
          },
        })}
      >
        <Tab.Screen
          name={Routes.GuestHome}
          component={GuestLandingScreen}
          options={{ title: "Home" }}
        />
        <Tab.Screen
          name={Routes.GuestCategories}
          component={SearchScreen}
          options={{ title: "Services" }}
        />
        <Tab.Screen
          name={Routes.GuestCompanies}
          component={CompanyListScreen}
          options={{ title: "Companies" }}
        />
        <Tab.Screen
          name={Routes.GuestAccount}
          component={GuestAccountScreen}
          options={{ title: "Account" }}
        />
      </Tab.Navigator>
    </>
  );
}

function CompanySubServicesRoute({ route }) {
  return (
    <CompanySubServices
      serviceId={route.params?.serviceId}
      serviceName={route.params?.serviceName}
    />
  );
}

export default function GuestStack() {
  return (
    <Stack.Navigator screenOptions={globalStackScreenOptions}>
      <Stack.Screen name={Routes.GuestTabs} component={GuestTabs} />
      <Stack.Screen
        name={Routes.CompanySubServices}
        component={CompanySubServicesRoute}
      />
      <Stack.Screen
        name={Routes.CompanyDetailScreen}
        component={CompanyDetailScreen}
      />
    </Stack.Navigator>
  );
}
