import React, { useRef } from "react";
import { Animated, Pressable } from "react-native";

/**
 * Pressable with a spring scale on press. Use `style` for the outer
 * (layout) wrapper and `contentStyle` for the touchable surface.
 */
export default function PressScale({
  children,
  onPress,
  onLongPress,
  style,
  contentStyle,
  scaleTo = 0.97,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = "button",
  hitSlop,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 28,
      bounciness: 0,
    }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => animateTo(scaleTo)}
        onPressOut={() => animateTo(1)}
        disabled={disabled}
        hitSlop={hitSlop}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [contentStyle, disabled && { opacity: 0.5 }, pressed && { opacity: 0.94 }]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}