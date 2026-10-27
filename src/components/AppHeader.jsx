// components/common/AppHeader.jsx
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  ink: "#172033",
  muted: "#667085",
  line: "#E5E7EB",
  surface: "#FFFFFF",
  red: "#DC2626",
};

/* ------------------------------------------------------------------ */
/* Icon button used for back and action buttons                        */
/* ------------------------------------------------------------------ */

function HeaderIconButton({
  icon,
  label,
  onPress,
  badge,
  loading = false,
  disabled = false,
  variant = "default",
}) {
  const isPrimary = variant === "primary";
  const iconColor = isPrimary ? "#fff" : COLORS.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.iconButton,
        isPrimary && styles.iconButtonPrimary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? "#fff" : COLORS.primary} />
      ) : (
        <Ionicons name={icon} size={20} color={iconColor} />
      )}

      {!!badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* AppHeader                                                           */
/* ------------------------------------------------------------------ */

/**
 * Props
 * - title         string   required
 * - subtitle      string   optional
 * - icon          string   Ionicons name shown in the brand tile when there is no back button
 * - showBack      boolean  shows a back button on the left (default false)
 * - onBack        fn       called by the back button
 * - actions       array    [{ icon, label, onPress, badge?, loading?, disabled?, variant? }]
 * - rightSlot     node     custom content rendered after the actions
 * - bordered      boolean  draws a bottom border and shadow (default true)
 */
export default function AppHeader({
  title,
  subtitle,
  icon = "apps-outline",
  showBack = false,
  onBack,
  actions = [],
  rightSlot,
  bordered = true,
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  return (
    <View style={[styles.outer, bordered && styles.bordered]}>
      <View style={[styles.inner, wide && styles.innerWide]}>
        {showBack ? (
          <HeaderIconButton icon="chevron-back" label="Go back" onPress={onBack} />
        ) : (
          <View style={styles.brandTile}>
            <Ionicons name={icon} size={20} color="#fff" />
          </View>
        )}

        <View style={styles.titleBlock}>
          <Text
            style={[styles.title, wide && styles.titleWide]}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.right}>
          {actions.map((action) => (
            <HeaderIconButton key={action.label} {...action} />
          ))}
          {rightSlot}
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  outer: {
    backgroundColor: COLORS.surface,
    width: "100%",
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    shadowColor: "#101828",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
  },
  innerWide: {
    maxWidth: 1180,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    minHeight: 72,
  },

  brandTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  titleBlock: { flex: 1, minWidth: 0 },
  title: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  titleWide: { fontSize: 20 },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  iconButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },

  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.red,
    borderWidth: 2,
    borderColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
});

{/* <AppHeader
  title="User Verification"
  subtitle="Review and manage registration requests"
  icon="shield-checkmark"
  actions={[
    {
      icon: "refresh-outline",
      label: "Refresh",
      onPress: refresh,
      loading: current?.isFetching,
    },
    {
      icon: "notifications-outline",
      label: "Notifications",
      onPress: () => {},
      badge: pendingCount,
    },
  ]}
/>
 
<AppHeader title="Profile" showBack onBack={() => navigation.goBack()} /> */}