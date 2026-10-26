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
    return (<Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
      <Card style={{ marginBottom: spacing.md }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              {service.featured && <Badge label="Featured" tone="accent"/>}
              {service.premium && <Badge label="Premium" tone="info"/>}
            </View>
            <Text style={styles.title}>{service.name}</Text>
          </View>
          <Pressable onPress={() => toggleFav(service.id)} hitSlop={10}>
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? colors.danger : colors.textMuted}/>
          </Pressable>
        </View>

        <Text style={styles.desc}>{truncate(service.description, 110)}</Text>

        <View style={styles.metaRow}>
          <RatingStars value={service.rating}/>
          <Text style={styles.meta}>{'\u00B7 '}{service.reviewsCount} reviews</Text>
          <Text style={styles.meta}>{'\u00B7 '}{service.experienceYears} yrs exp</Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.price}>
            {formatINR(service.priceFrom)} <Text style={styles.unit}>{service.priceUnit}</Text>
          </Text>
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted}/>
            <Text style={styles.meta}>{service.city}</Text>
          </View>
        </View>
      </Card>
    </Pressable>);
}
const styles = StyleSheet.create({
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    badgeRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
    title: { ...typography.h3, color: colors.text },
    desc: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 4 },
    meta: { ...typography.small, color: colors.textMuted },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
    price: { ...typography.h3, color: colors.primary },
    unit: { ...typography.small, color: colors.textMuted, fontWeight: '400' },
    locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
