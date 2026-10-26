import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import Avatar from './Avatar';
import RatingStars from './RatingStars';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
export default function VendorCard({ company, onPress }) {
    return (<Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
      <Card style={{ marginBottom: spacing.md }}>
        <View style={styles.row}>
          <Avatar name={company.name} size={48}/>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.name}>{company.name}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted}/>
              <Text style={styles.meta}>{company.city}, {company.state}</Text>
            </View>
            <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
              <RatingStars value={company.rating}/>
              <Text style={styles.meta}>  {company.reviewsCount} reviews</Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>);
}
const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    name: { ...typography.h3, color: colors.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    meta: { ...typography.small, color: colors.textMuted },
});
