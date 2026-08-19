import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export default function ScreenHeader({ title, subtitle, showBack, right, style }: Props) {
  const navigation = useNavigation<any>();
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.left}>
        {showBack && navigation?.canGoBack?.() ? (
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ marginRight: spacing.sm }}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
        ) : null}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});
