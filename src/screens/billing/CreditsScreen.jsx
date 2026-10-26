import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Button, Badge } from '@/components';
import { mockCreditPacks } from '@/services/mockData';
import { useAuthStore } from '@/store/authStore';
import { Routes } from '@/constants/routes';
import { CREDIT_COSTS } from '@/constants/config';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { formatINR } from '@/utils/formatters';
import { useCreditsStore } from '@/store/creditsStore';
export default function CreditsScreen() {
    const nav = useNavigation();
    const user = useAuthStore((s) => s.user);
    const topUp = useCreditsStore((s) => s.topUp);
    const buy = (creditAmount, price) => {
        nav.navigate(Routes.Checkout, {
            title: `${creditAmount} credit pack`,
            amount: price,
            onSuccess: () => topUp(creditAmount),
        });
    };
    return (<Screen>
      <ScreenHeader title="Credits" showBack right={<Pressable onPress={() => nav.navigate(Routes.PurchaseHistory)}>
          <Ionicons name="receipt-outline" size={22} color={colors.text}/>
        </Pressable>}/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available credits</Text>
          <Text style={styles.balance}>{user?.credits ?? 0}</Text>
          <Text style={styles.balanceHint}>Use credits to unlock contacts, premium docs and leads</Text>
        </Card>

        <Text style={styles.section}>How credits are used</Text>
        <Card style={{ marginBottom: spacing.lg }}>
          <Row label="View vendor contact" cost={CREDIT_COSTS.VIEW_CONTACT}/>
          <Row label="Download company profile" cost={CREDIT_COSTS.DOWNLOAD_PROFILE}/>
          <Row label="Download document" cost={CREDIT_COSTS.DOWNLOAD_DOCUMENT}/>
          <Row label="Premium lead unlock" cost={CREDIT_COSTS.PREMIUM_LEAD_UNLOCK} last/>
        </Card>

        <Text style={styles.section}>Buy credits</Text>
        {mockCreditPacks.map((p) => (<Card key={p.id} style={styles.packCard}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={styles.packValue}>{p.credits} credits</Text>
                {p.bonus ? <Badge label={`+${p.bonus} bonus`} tone="success"/> : null}
              </View>
              <Text style={styles.packMeta}>{formatINR(p.price)}{p.bonus ? `   \u00B7  ${Math.round(p.price / (p.credits + p.bonus))}\u20B9/credit` : ''}</Text>
            </View>
            <Button title="Buy" onPress={() => buy(p.credits + (p.bonus ?? 0), p.price)}/>
          </Card>))}
      </ScrollView>
    </Screen>);
}
function Row({ label, cost, last }) {
    return (<View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={typography.body}>{label}</Text>
      <Text style={{ ...typography.bodyBold, color: colors.primary }}>{cost} credits</Text>
    </View>);
}
const styles = StyleSheet.create({
    balanceCard: { backgroundColor: colors.primary, alignItems: 'center', marginBottom: spacing.lg },
    balanceLabel: { color: '#B4C5DA', fontSize: 12 },
    balance: { color: colors.textInverse, fontSize: 44, fontWeight: '800', marginTop: 4 },
    balanceHint: { color: '#B4C5DA', fontSize: 12, marginTop: 4, textAlign: 'center' },
    section: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
    packCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    packValue: { ...typography.h3, color: colors.text },
    packMeta: { ...typography.small, color: colors.textMuted, marginTop: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
});
