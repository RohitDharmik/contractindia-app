import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, CategoryChip } from '@/components';
import { mockCategories } from '@/services/mockData';
import { Routes } from '@/constants/routes';
import { spacing, typography } from '@/constants/sizes';
import { colors } from '@/constants/colors';
export default function CategoriesScreen() {
    const nav = useNavigation();
    return (<Screen>
      <ScreenHeader title="Marketplace" subtitle="Browse all service categories"/>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}>
        <Text style={styles.h}>{mockCategories.length} categories</Text>
        <View style={styles.grid}>
          {mockCategories.map((c) => (<CategoryChip key={c.id} category={c} onPress={() => nav.navigate(Routes.ServiceList, { category: c.id, title: c.name })}/>))}
        </View>
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    h: { ...typography.small, color: colors.textMuted, marginBottom: spacing.md },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
