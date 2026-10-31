import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import Badge from './Badge';
import RatingStars from './RatingStars';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { formatINR, truncate } from '@/utils/formatters';
import { useFavoritesStore } from '@/store/favoritesStore';
export default function ServiceCard({ service, onPress }) {
    const isFav = useFavoritesStore((s) => s.isFavorite(service.id));
    const toggleFav = useFavoritesStore((s) => s.toggleFavorite);
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${service.name}, starting at ${formatINR(service.priceFrom)}`}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.serviceMark}>
              <Ionicons name="briefcase-outline" size={19} color={colors.primary} />
            </View>
            <View style={styles.titleContent}>
              <View style={styles.badgeRow}>
                {service.featured && <Badge label="Featured" tone="accent" />}
                {service.premium && <Badge label="Premium" tone="info" />}
              </View>
              <Text style={styles.title} numberOfLines={2}>{service.name}</Text>
            </View>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                toggleFav(service.id);
              }}
              style={({ pressed }) => [styles.favoriteButton, pressed && styles.favoritePressed]}
              accessibilityRole="button"
              accessibilityLabel={isFav ? 'Remove from saved services' : 'Save service'}
              accessibilityState={{ selected: isFav }}
              hitSlop={4}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={19}
                color={isFav ? colors.danger : colors.textMuted}
              />
            </Pressable>
          </View>

          {!!service.description && (
            <Text style={styles.desc} numberOfLines={3}>
              {truncate(service.description, 110)}
            </Text>
          )}

          <View style={styles.metaRow}>
            <RatingStars value={service.rating} size={13} />
            <View style={styles.metaDivider} />
            <Text style={styles.meta}>{service.reviewsCount} reviews</Text>
            <View style={styles.metaDivider} />
            <Text style={styles.meta}>{service.experienceYears} yrs experience</Text>
          </View>

          <View style={styles.footerRow}>
            <View>
              <Text style={styles.priceLabel}>Starting at</Text>
              <Text style={styles.price}>
                {formatINR(service.priceFrom)}
                <Text style={styles.unit}> {service.priceUnit}</Text>
              </Text>
            </View>
            <View style={styles.location}>
              <Ionicons name="location-outline" size={15} color={colors.textMuted} />
              <Text style={styles.meta} numberOfLines={1}>{service.city}</Text>
            </View>
          </View>
        </Card>
      </Pressable>
    );
}
const styles = StyleSheet.create({
    pressable: { marginBottom: spacing.md },
    pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
    card: {
        padding: spacing.lg,
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 18,
    },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    serviceMark: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#EFF5FA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContent: { flex: 1, minWidth: 0, paddingTop: 1 },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
    title: { ...typography.h3, color: colors.text, lineHeight: 23 },
    favoriteButton: {
        width: 44,
        height: 44,
        marginTop: -spacing.xs,
        marginRight: -spacing.xs,
        borderRadius: 14,
        backgroundColor: colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
    },
    favoritePressed: { opacity: 0.65, transform: [{ scale: 0.94 }] },
    desc: { ...typography.body, color: colors.textMuted, marginTop: spacing.md, lineHeight: 21 },
    metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: spacing.md, gap: spacing.xs },
    metaDivider: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#A8B4C1', marginHorizontal: 2 },
    meta: { ...typography.small, color: colors.textMuted, flexShrink: 1 },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: spacing.sm,
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    priceLabel: { ...typography.small, color: colors.textMuted, marginBottom: 2 },
    price: { ...typography.h3, color: colors.primary },
    unit: { ...typography.small, color: colors.textMuted, fontWeight: '400' },
    location: { maxWidth: '48%', flexDirection: 'row', alignItems: 'center', gap: 5, paddingBottom: 2 },
});
