import { colors } from "@/constants/colors";

export const globalStackScreenOptions = {
  headerShown: false,
  animation: "slide_from_right",
  gestureEnabled: true,
  contentStyle: { backgroundColor: colors.bg },
};

export const authenticationStackScreenOptions = {
  ...globalStackScreenOptions,
  animation: "fade",
  animationDuration: 300,
};

export const rootStackScreenOptions = {
  ...globalStackScreenOptions,
  animation: "fade",
  animationDuration: 300,
};

export const modalStackScreenOptions = {
  presentation: "modal",
  animation: "slide_from_bottom",
  gestureEnabled: true,
};
