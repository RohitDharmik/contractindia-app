import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
export default function CategoryChip({ category, onPress, variant = 'tile' }) {
    if (variant === 'chip') {
        return (<Pressable onPress={onPress} style={styles.chip}>
        <Ionicons name={category.icon} size={14} color={colors.primary}/>
        <Text style={styles.chipText}>{category.name}</Text>
      </Pressable>);
    }
    return (<Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}>
      <View style={styles.iconBubble}>
        <Ionicons name={category.icon} size={22} color={colors.primary}/>
      </View>
      <Text style={styles.tileName} numberOfLines={2}>{category.name}</Text>
      <Text style={styles.tileCount}>{category.count} providers</Text>
    </Pressable>);
}
const styles = StyleSheet.create({
    tile: {
        width: '31%',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        alignItems: 'center',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconBubble: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    tileName: { ...typography.label, color: colors.text, textAlign: 'center' },
    tileCount: { ...typography.small, color: colors.textMuted, marginTop: 2 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
    },
    chipText: { ...typography.label, color: colors.primary },
});
