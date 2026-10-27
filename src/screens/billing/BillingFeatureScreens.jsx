import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState, Screen, ScreenHeader } from '@/components';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { formatINR } from '@/utils/formatters';

export function CreditsScreen() {
    return <Screen>
        <ScreenHeader title="Credits" subtitle="Account balance" showBack/>
        <ScrollView contentContainerStyle={styles.content}>
            <Card style={styles.infoCard}>
                <View style={styles.headingRow}>
                    <Ionicons name="wallet-outline" size={21} color={colors.primary}/>
                    <Text style={styles.heading}>Credit balance unavailable</Text>
                </View>
                <Text style={styles.body}>The app has no trusted balance or top-up API yet. Demo balances and packs are hidden to avoid showing funds that do not exist.</Text>
            </Card>
            <Card style={styles.infoCard}>
                <Text style={styles.cardTitle}>Top-ups are disabled</Text>
                <Text style={styles.body}>Credit purchases can be enabled when the backend provides order creation and authoritative payment verification.</Text>
            </Card>
        </ScrollView>
    </Screen>;
}

export function PurchaseHistoryScreen() {
    return <Screen>
        <ScreenHeader title="Purchase history" subtitle="Receipts and transactions" showBack/>
        <EmptyState icon="receipt-outline" title="Purchase history unavailable" body="A personal payment-history query and receipt contract are not confirmed. No shared or mock payment records are shown."/>
    </Screen>;
}

export function CheckoutScreen({ route }) {
    const title = route?.params?.title || 'Purchase';
    const amount = Number(route?.params?.amount);
    const hasAmount = Number.isFinite(amount) && amount >= 0;
    return <Screen>
        <ScreenHeader title="Checkout" subtitle="Payment unavailable" showBack/>
        <ScrollView contentContainerStyle={styles.content}>
            <Card style={styles.orderCard}>
                <Text style={styles.label}>Order summary</Text>
                <View style={styles.orderRow}>
                    <Text style={styles.body}>{title}</Text>
                    {hasAmount ? <Text style={styles.amount}>{formatINR(amount)}</Text> : null}
                </View>
            </Card>
            <Card style={styles.infoCard}>
                <View style={styles.headingRow}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.warning}/>
                    <Text style={styles.heading}>Payment is not enabled</Text>
                </View>
                <Text style={styles.body}>Checkout requires a server-created order and authoritative payment verification. No payment is attempted and no entitlement is activated.</Text>
            </Card>
        </ScrollView>
    </Screen>;
}

const styles = StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
    infoCard: { marginBottom: spacing.md },
    orderCard: { marginBottom: spacing.md },
    headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    heading: { ...typography.h3, color: colors.text, flex: 1 },
    cardTitle: { ...typography.bodyBold, color: colors.text },
    body: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
    label: { ...typography.small, color: colors.textMuted },
    orderRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.md },
    amount: { ...typography.bodyBold, color: colors.text },
});