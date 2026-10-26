import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
export default function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, fullWidth, icon, style, }) {
    const isDisabled = disabled || loading;
    return (<Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [
            styles.base,
            sizes[size],
            variants[variant].container,
            fullWidth && { alignSelf: 'stretch' },
            isDisabled && { opacity: 0.5 },
            pressed && { opacity: 0.85 },
            style,
        ]}>
      {loading ? (<ActivityIndicator color={variants[variant].textColor}/>) : (<View style={styles.row}>
          {icon}
          <Text style={[styles.text, { color: variants[variant].textColor, marginLeft: icon ? spacing.sm : 0 }]}>
            {title}
          </Text>
        </View>)}
    </Pressable>);
}
const styles = StyleSheet.create({
    base: {
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    text: { ...typography.bodyBold },
});
const sizes = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
    md: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
    lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl },
};
const variants = {
    primary: { container: { backgroundColor: colors.primary }, textColor: colors.textInverse },
    secondary: { container: { backgroundColor: colors.accent }, textColor: colors.text },
    outline: {
        container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
        textColor: colors.primary,
    },
    ghost: { container: { backgroundColor: 'transparent' }, textColor: colors.primary },
    danger: { container: { backgroundColor: colors.danger }, textColor: colors.textInverse },
};
