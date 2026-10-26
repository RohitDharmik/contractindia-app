import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Button, Badge } from '@/components';
import { mockPlans } from '@/services/mockData';
import { useAuthStore } from '@/store/authStore';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { formatINR } from '@/utils/formatters';
export default function PlansScreen() {
    const nav = useNavigation();
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const choose = (planId) => {
        nav.navigate(Routes.Checkout, {
            title: `Subscribe to ${planId}`,
            amount: mockPlans.find((p) => p.id === planId)?.pricePerMonth ?? 0,
            onSuccess: () => {
                if (user)
                    setUser({ ...user, plan: planId });
            },
        });
    };
    return (<Screen>
      <ScreenHeader title="Plans" subtitle="Choose what fits your business" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        {mockPlans.map((p) => {
            const current = user?.plan === p.id;
            return (<Card key={p.id} style={[styles.card, p.recommended && styles.recommended]}>
              {p.recommended ? <Badge label="Recommended" tone="accent"/> : null}
              <Text style={styles.name}>{p.name}</Text>
              {p.highlight ? <Text style={styles.highlight}>{p.highlight}</Text> : null}
              <View style={styles.priceRow}>
                <Text style={styles.price}>{p.pricePerMonth === 0 ? 'Free' : formatINR(p.pricePerMonth)}</Text>
                {p.pricePerMonth > 0 ? <Text style={styles.unit}>/ month</Text> : null}
              </View>
              <Text style={styles.credits}>{p.credits} credits / month</Text>
              <View style={{ marginTop: spacing.md }}>
                {p.features.map((f) => (<View key={f} style={styles.feat}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success}/>
                    <Text style={styles.featText}>{f}</Text>
                  </View>))}
              </View>
              <Button title={current ? 'Current plan' : p.pricePerMonth === 0 ? 'Switch to free' : 'Subscribe'} disabled={current} fullWidth style={{ marginTop: spacing.md }} onPress={() => choose(p.id)}/>
            </Card>);
        })}
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    card: { marginBottom: spacing.md },
    recommended: { borderWidth: 2, borderColor: colors.accent },
    name: { ...typography.h2, color: colors.text, marginTop: spacing.xs },
    highlight: { ...typography.small, color: colors.textMuted },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.sm },
    price: { ...typography.h1, color: colors.primary },
    unit: { ...typography.body, color: colors.textMuted, marginLeft: 6 },
    credits: { ...typography.label, color: colors.accent, marginTop: 4 },
    feat: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
    featText: { ...typography.body, color: colors.text },
});
