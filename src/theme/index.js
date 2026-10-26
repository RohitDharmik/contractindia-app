import { DefaultTheme } from '@react-navigation/native';
import { colors } from '@/constants/colors';
export const navigationTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: colors.primary,
        background: colors.bg,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
    },
};
export const theme = {
    colors,
};
