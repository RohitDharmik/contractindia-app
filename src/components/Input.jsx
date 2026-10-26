import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
export default function Input({ label, error, hint, leftIcon, rightIcon, style, ...rest }) {
    return (<View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.box, error ? { borderColor: colors.danger } : null]}>
        {leftIcon ? <View style={{ marginRight: spacing.sm }}>{leftIcon}</View> : null}
        <TextInput placeholderTextColor={colors.textMuted} style={[styles.input, style]} {...rest}/>
        {rightIcon ? <View style={{ marginLeft: spacing.sm }}>{rightIcon}</View> : null}
      </View>
      {error ? (<Text style={styles.error}>{error}</Text>) : hint ? (<Text style={styles.hint}>{hint}</Text>) : null}
    </View>);
}
const styles = StyleSheet.create({
    label: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        minHeight: 46,
    },
    input: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm },
    error: { ...typography.small, color: colors.danger, marginTop: spacing.xs },
    hint: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
});
