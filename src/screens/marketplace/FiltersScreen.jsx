import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Button, Input } from '@/components';
import { mockCategories } from '@/services/mockData';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
const cities = ['Mumbai', 'Bengaluru', 'Hyderabad', 'Pune', 'Delhi', 'Chennai', 'Kolkata'];
const budgets = ['<\u20B91L', '\u20B91-5L', '\u20B95-25L', '\u20B925L+'];
const ratings = ['4.5+', '4.0+', '3.5+'];
export default function FiltersScreen() {
    const nav = useNavigation();
    const [city, setCity] = useState();
    const [budget, setBudget] = useState();
    const [rating, setRating] = useState();
    const [cat, setCat] = useState();
    const [exp, setExp] = useState('');
    const Chip = ({ label, active, onPress }) => (<Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>);
    return (<Screen>
      <ScreenHeader title="Filters" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        <Group title="Category">
          <View style={styles.wrap}>
            {mockCategories.slice(0, 8).map((c) => (<Chip key={c.id} label={c.name} active={cat === c.id} onPress={() => setCat(cat === c.id ? undefined : c.id)}/>))}
          </View>
        </Group>

        <Group title="City">
          <View style={styles.wrap}>
            {cities.map((c) => (<Chip key={c} label={c} active={city === c} onPress={() => setCity(city === c ? undefined : c)}/>))}
          </View>
        </Group>

        <Group title="Budget">
          <View style={styles.wrap}>
            {budgets.map((b) => (<Chip key={b} label={b} active={budget === b} onPress={() => setBudget(budget === b ? undefined : b)}/>))}
          </View>
        </Group>

        <Group title="Rating">
          <View style={styles.wrap}>
            {ratings.map((r) => (<Chip key={r} label={`\u2605 ${r}`} active={rating === r} onPress={() => setRating(rating === r ? undefined : r)}/>))}
          </View>
        </Group>

        <Group title="Minimum experience (years)">
          <Input placeholder="e.g. 5" keyboardType="number-pad" value={exp} onChangeText={setExp}/>
        </Group>
      </ScrollView>

      <View style={styles.bar}>
        <Button title="Reset" variant="ghost" onPress={() => { setCity(undefined); setBudget(undefined); setRating(undefined); setCat(undefined); setExp(''); }}/>
        <Button title="Apply filters" onPress={() => nav.goBack()}/>
      </View>
    </Screen>);
}
function Group({ title, children }) {
    return (<View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.gtitle}>{title}</Text>
      {children}
    </View>);
}
const styles = StyleSheet.create({
    gtitle: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.small, color: colors.text, fontWeight: '600' },
    chipTextActive: { color: colors.textInverse },
    bar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' },
});
