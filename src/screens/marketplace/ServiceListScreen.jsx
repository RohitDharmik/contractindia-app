import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen, ScreenHeader, ServiceCard, EmptyState } from '@/components';
import { mockServices } from '@/services/mockData';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
export default function ServiceListScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const { category, title } = route.params ?? {};
    const [sort, setSort] = useState('recommended');
    const list = useMemo(() => {
        let arr = mockServices.filter((s) => !category || s.category === category);
        switch (sort) {
            case 'rating':
                arr = [...arr].sort((a, b) => b.rating - a.rating);
                break;
            case 'price_low':
                arr = [...arr].sort((a, b) => a.priceFrom - b.priceFrom);
                break;
            case 'price_high':
                arr = [...arr].sort((a, b) => b.priceFrom - a.priceFrom);
                break;
        }
        return arr;
    }, [category, sort]);
    return (<Screen>
      <ScreenHeader title={title ?? 'Services'} showBack right={<Pressable onPress={() => nav.navigate(Routes.Filters, { category })}>
            <Ionicons name="options-outline" size={22} color={colors.text}/>
          </Pressable>}/>

      <View style={styles.sortRow}>
        {['recommended', 'rating', 'price_low', 'price_high'].map((s) => (<Pressable key={s} onPress={() => setSort(s)} style={[styles.chip, sort === s && styles.chipActive]}>
            <Text style={[styles.chipText, sort === s && styles.chipTextActive]}>
              {s === 'recommended' ? 'Top picks' : s === 'rating' ? 'Top rated' : s === 'price_low' ? 'Price: low' : 'Price: high'}
            </Text>
          </Pressable>))}
      </View>

      <FlatList data={list} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }} ListEmptyComponent={<EmptyState title="No services yet" body="Try changing filters or pick a different category."/>} renderItem={({ item }) => <ServiceCard service={item} onPress={() => nav.navigate(Routes.ServiceDetail, { id: item.id })}/>}/>
    </Screen>);
}
const styles = StyleSheet.create({
    sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
    chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.small, color: colors.text, fontWeight: '600' },
    chipTextActive: { color: colors.textInverse },
});
