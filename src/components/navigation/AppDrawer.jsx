// src/navigation/AppDrawer.jsx
import React from "react";
import { useWindowDimensions, View } from "react-native";
import { createDrawerNavigator, DrawerItemList } from "@react-navigation/drawer";
import CategorySidebar from "./CategorySidebar";
import MainTabs from "@/navigation/MainTabs";
import CompanySubServices from "@/screens/public/CompanySubServices";
import PlansAndSubscriptionsScreen from "@/screens/plans/PlansAndSubscriptionsScreen";

const Drawer = createDrawerNavigator();

function CompanySubServicesRoute({ route }) {
  return (
    <CompanySubServices
      serviceId={route.params?.serviceId}
      serviceName={route.params?.serviceName}
    />
  );
}

function DrawerContent(props) {
  return (
    <View style={{ flex: 1 }}>
      <DrawerItemList {...props} />
      <CategorySidebar />
    </View>
  );
}

export default function AppDrawer() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: isTablet ? "permanent" : "front",
        drawerStyle: { width: isTablet ? 300 : 320 },
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