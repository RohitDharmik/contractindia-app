import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, LeadCard, EmptyState } from '@/components';
import { useLeadsStore } from '@/store/leadsStore';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
const filters = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'negotiation', label: 'Negotiation' },
    { key: 'converted', label: 'Converted' },
    { key: 'closed', label: 'Closed' },
];
export default function LeadInboxScreen() {
    const nav = useNavigation();
    const leads = useLeadsStore((s) => s.leads);
    const [filter, setFilter] = useState('all');
    const list = useMemo(() => (filter === 'all' ? leads : leads.filter((l) => l.status === filter)), [leads, filter]);
    return (<Screen>
      <ScreenHeader title="Leads" subtitle={`${leads.length} total`}/>
      <View style={styles.tabRow}>
        <FlatList data={filters} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(i) => i.key} contentContainerStyle={{ paddingHorizontal: spacing.lg }} renderItem={({ item }) => (<Pressable onPress={() => setFilter(item.key)} style={[styles.tab, filter === item.key && styles.tabActive]}>
              <Text style={[styles.tabText, filter === item.key && styles.tabTextActive]}>{item.label}</Text>
            </Pressable>)}/>
      </View>
      <FlatList data={list} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }} ListEmptyComponent={<EmptyState icon="megaphone-outline" title="No leads here" body="Leads will appear when buyers submit inquiries."/>} renderItem={({ item }) => <LeadCard lead={item} onPress={() => nav.navigate(Routes.LeadDetail, { id: item.id })}/>}/>
    </Screen>);
}
const styles = StyleSheet.create({
    tabRow: { paddingBottom: spacing.sm },
    tab: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { ...typography.small, color: colors.text, fontWeight: '600' },
    tabTextActive: { color: colors.textInverse },
});
