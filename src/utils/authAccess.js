import { Alert } from "react-native";
import { Routes } from "@/constants/routes";
import { useAuthStore } from "@/store/authStore";

export const isAuthenticated = () =>
  useAuthStore.getState().user?.isLoginSuccessbyOtp === true;

export const openAuthentication = (navigation, initialRoute = Routes.Login) => {
  let rootNavigation = navigation;
  while (rootNavigation?.getParent?.()) {
    rootNavigation = rootNavigation.getParent();
  }
  rootNavigation?.navigate(Routes.AuthStack, {
    screen: initialRoute,
  });
};

export const requireAuthentication = (
  navigation,
  {
    title = "Sign in to continue",
    message = "Sign in or create an account to use this feature.",
  } = {},
) => {
  if (isAuthenticated()) return true;

  Alert.alert(title, message, [
    { text: "Continue browsing", style: "cancel" },
    {
      text: "Create account",
      onPress: () => openAuthentication(navigation, Routes.Register),
    },
    {
      text: "Sign in",
      onPress: () => openAuthentication(navigation, Routes.Login),
    },
  ]);
  return false;
};
