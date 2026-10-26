import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, ServiceCard, EmptyState } from '@/components';
import { mockServices, mockCategories } from '@/services/mockData';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
const recentSearches = ['Architect Pune', 'OPC cement Hyderabad', 'PMC Bengaluru'];
export default function SearchScreen() {
    const nav = useNavigation();
    const [q, setQ] = useState('');
    const results = useMemo(() => {
        if (!q.trim())
            return [];
        const term = q.toLowerCase();
        return mockServices.filter((s) => s.name.toLowerCase().includes(term) ||
            s.description.toLowerCase().includes(term) ||
            s.city.toLowerCase().includes(term) ||
            s.tags.some((t) => t.toLowerCase().includes(term)));
    }, [q]);
    return (<Screen>
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text}/>
        </Pressable>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted}/>
          <TextInput autoFocus value={q} onChangeText={setQ} placeholder="Search services, vendors, materials..." placeholderTextColor={colors.textMuted} style={styles.searchInput}/>
          {q ? (<Pressable onPress={() => setQ('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted}/>
            </Pressable>) : null}
        </View>
      </View>

      {!q ? (<View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={styles.section}>Recent searches</Text>
          {recentSearches.map((r) => (<Pressable key={r} onPress={() => setQ(r)} style={styles.recentRow}>
              <Ionicons name="time-outline" size={18} color={colors.textMuted}/>
              <Text style={styles.recentText}>{r}</Text>
            </Pressable>))}
          <Text style={[styles.section, { marginTop: spacing.lg }]}>Trending categories</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {mockCategories.slice(0, 6).map((c) => (<Pressable key={c.id} onPress={() => nav.navigate(Routes.ServiceList, { category: c.id, title: c.name })} style={styles.trendChip}>
                <Text style={styles.trendText}>{c.name}</Text>
              </Pressable>))}
          </View>
        </View>) : (<FlatList data={results} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }} ListEmptyComponent={<EmptyState title="No results" body={`We couldn\u2019t find anything for \u201C${q}\u201D`}/>} renderItem={({ item }) => <ServiceCard service={item} onPress={() => nav.navigate(Routes.ServiceDetail, { id: item.id })}/>}/>)}
    </Screen>);
}
const styles = StyleSheet.create({
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
    searchInput: { flex: 1, ...typography.body, color: colors.text },
    section: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
    recentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
    recentText: { ...typography.body, color: colors.text },
    trendChip: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border },
    trendText: { ...typography.small, color: colors.text, fontWeight: '600' },
});
