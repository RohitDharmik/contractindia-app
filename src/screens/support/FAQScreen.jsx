import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card } from '@/components';
import { mockFaqs } from '@/services/mockData';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
export default function FAQScreen() {
    const cats = useMemo(() => Array.from(new Set(mockFaqs.map((f) => f.category))), []);
    const [cat, setCat] = useState(cats[0]);
    const [open, setOpen] = useState(null);
    const list = mockFaqs.filter((f) => f.category === cat);
    return (<Screen>
      <ScreenHeader title="FAQ" subtitle="Frequently asked questions" showBack/>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        {cats.map((c) => (<Pressable key={c} onPress={() => setCat(c)} style={[styles.chip, cat === c && styles.chipActive]}>
            <Text style={[styles.chipText, cat === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>))}
      </ScrollView>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {list.map((f) => {
            const isOpen = open === f.id;
            return (<Card key={f.id} style={{ marginBottom: spacing.sm }}>
              <Pressable onPress={() => setOpen(isOpen ? null : f.id)} style={styles.row}>
                <Text style={[typography.bodyBold, { flex: 1 }]}>{f.question}</Text>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted}/>
              </Pressable>
              {isOpen ? <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm }}>{f.answer}</Text> : null}
            </Card>);
        })}
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.small, color: colors.text, fontWeight: '600' },
    chipTextActive: { color: colors.textInverse },
    row: { flexDirection: 'row', alignItems: 'center' },
});
