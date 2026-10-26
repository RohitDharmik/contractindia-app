import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
const tones = {
    default: { bg: colors.surfaceAlt, fg: colors.text },
    success: { bg: '#DCFCE7', fg: '#15803D' },
    warning: { bg: '#FEF3C7', fg: '#B45309' },
    danger: { bg: '#FEE2E2', fg: '#B91C1C' },
    info: { bg: '#DBEAFE', fg: '#1D4ED8' },
    accent: { bg: '#FFE9C7', fg: '#92400E' },
};
export default function Badge({ label, tone = 'default' }) {
    const t = tones[tone];
    return (<View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>);
}
const styles = StyleSheet.create({
    badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
    text: { ...typography.small, fontWeight: '600' },
});
