
import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';

export default function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  left,
  right,
  style,
  onBack,
  backLabel = 'Go back',
  titleNumberOfLines = 2,
  subtitleNumberOfLines = 2,
}) {
  const navigation = useNavigation();

  const canGoBack =
    typeof navigation?.canGoBack === 'function' &&
    navigation.canGoBack();

  const handleBack = useCallback(() => {
    if (typeof onBack === 'function') {
      onBack();
      return;
    }

    if (
      typeof navigation?.canGoBack === 'function' &&
      navigation.canGoBack() &&
      typeof navigation?.goBack === 'function'
    ) {
      navigation.goBack();
    }
  }, [navigation, onBack]);

  const shouldShowBack = showBack && (onBack || canGoBack);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftSection}>
        {shouldShowBack && (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={8}
            android_ripple={{
              color: colors.border || '#E5E7EB',
              borderless: true,
            }}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            accessibilityHint="Returns to the previous screen"
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color={colors.text}
            />
          </Pressable>
        )}

        {left && (
          <View style={styles.customLeft}>
            {left}
          </View>
        )}

        <View style={styles.titleContainer}>
          {!!title && (
            <Text
              style={styles.title}
              numberOfLines={titleNumberOfLines}
              ellipsizeMode="tail"
              accessibilityRole="header"
            >
              {title}
            </Text>
          )}

          {!!subtitle && (
            <Text
              style={styles.subtitle}
              numberOfLines={subtitleNumberOfLines}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {right && (
        <View style={styles.rightSection}>
          {right}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  leftSection: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    marginRight: spacing.sm,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },

  backButtonPressed: {
    opacity: 0.65,
  },

  customLeft: {
    flexShrink: 0,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },

  title: {
    ...typography.h2,
    color: colors.text,
    flexShrink: 1,
  },

  subtitle: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 3,
    flexShrink: 1,
  },

  rightSection: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: spacing.sm,
  },
});
