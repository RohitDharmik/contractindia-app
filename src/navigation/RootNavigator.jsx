import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "@/store/authStore";
import { Routes } from "@/constants/routes";
import AuthStack from "./AuthStack";
import AppStack from "./AppStack";
import OnboardingScreen from "@/screens/auth/OnboardingScreen";
import SplashScreen from "@/screens/auth/SplashScreen";
import { colors } from "@/constants/colors";
const Stack = createNativeStackNavigator();
export default function RootNavigator() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {
        user?.isLoginSuccessbyOtp === true ? (
          <Stack.Screen name="App" component={AppStack} />
        ) : !hasOnboarded ? (
          <>
            <Stack.Screen name={Routes.Splash} component={SplashScreen} />
            <Stack.Screen
              name={Routes.Onboarding}
              component={OnboardingScreen}
            />
          </>
        ) : (
          <Stack.Screen name={Routes.AuthStack} component={AuthStack} />
        )
      }
    </Stack.Navigator>
  );
}
