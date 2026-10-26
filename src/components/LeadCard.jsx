import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import Badge from './Badge';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { formatINR, formatRelativeTime } from '@/utils/formatters';
const statusTone = {
    new: 'info',
    assigned: 'accent',
    contacted: 'warning',
    negotiation: 'warning',
    converted: 'success',
    closed: 'default',
};
export default function LeadCard({ lead, onPress }) {
    return (<Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
      <Card style={{ marginBottom: spacing.md }}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{lead.buyerName}</Text>
            <Text style={styles.service} numberOfLines={1}>{lead.serviceName}</Text>
          </View>
          <Badge label={lead.status?.toUpperCase()} tone={statusTone[lead.status]}/>
        </View>
        <Text style={styles.msg} numberOfLines={2}>{lead.message}</Text>
        <View style={styles.metaRow}>
          {lead.budget ? (<View style={styles.metaItem}>
              <Ionicons name="wallet-outline" size={14} color={colors.textMuted}/>
              <Text style={styles.meta}>{formatINR(lead.budget)}</Text>
            </View>) : null}
          {lead.city ? (<View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted}/>
              <Text style={styles.meta}>{lead.city}</Text>
            </View>) : null}
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted}/>
            <Text style={styles.meta}>{formatRelativeTime(lead.createdAt)}</Text>
          </View>
        </View>
      </Card>
    </Pressable>);
}
const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    title: { ...typography.h3, color: colors.text },
    service: { ...typography.small, color: colors.primary, marginTop: 2 },
    msg: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    meta: { ...typography.small, color: colors.textMuted },
});
