import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "@/store/authStore";
import { Routes } from "@/constants/routes";
import AuthStack from "./AuthStack";
import AppStack from "./AppStack";
import GuestStack from "./GuestStack";
import { colors } from "@/constants/colors";
import { rootStackScreenOptions } from "./stackOptions";
const Stack = createNativeStackNavigator();
export default function RootNavigator() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = user?.isLoginSuccessbyOtp === true;
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.primary,
        }}
      >
        <ActivityIndicator color="#fff" />
      </View>
    );
  }
  return (
    <Stack.Navigator screenOptions={rootStackScreenOptions}>
      {isAuthenticated ? (
        <Stack.Screen name="App" component={AppStack} />
      ) : (
        <>
          <Stack.Screen name={Routes.Guest} component={GuestStack} />
          <Stack.Screen name={Routes.AuthStack} component={AuthStack} />
        </>
      )}
    </Stack.Navigator>
  );
}
