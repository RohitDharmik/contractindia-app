import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card, Badge, Input } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { formatINR } from '@/utils/formatters';
import { adminPayments } from '@/services/adminMockData';
const STATUS_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'success', label: 'Success' },
    { key: 'pending', label: 'Pending' },
    { key: 'failed', label: 'Failed' },
    { key: 'refunded', label: 'Refunded' },
];
function tone(s) {
    switch (s) {
        case 'success': return 'success';
        case 'pending': return 'warning';
        case 'failed': return 'danger';
        case 'refunded': return 'info';
    }
}
export default function PaymentsScreen() {
    const [filter, setFilter] = useState('all');
    const [q, setQ] = useState('');
    const data = useMemo(() => {
        const s = q.trim().toLowerCase();
        return adminPayments.filter((p) => {
            if (filter !== 'all' && p.status !== filter)
                return false;
            if (!s)
                return true;
            return p.user.toLowerCase().includes(s) || p.txnId.toLowerCase().includes(s) || p.description.toLowerCase().includes(s);
        });
    }, [filter, q]);
    const totals = useMemo(() => {
        const success = adminPayments.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount, 0);
        const refunded = adminPayments.filter((p) => p.status === 'refunded').reduce((s, p) => s + p.amount, 0);
        return { net: success - refunded, success, refunded };
    }, []);
    return (<Screen>
      <ScreenHeader title="Payments" subtitle="Razorpay & Stripe reconciliation" showBack/>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
        <View style={styles.kpis}>
          <Card style={styles.kpi}>
            <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>NET (PERIOD)</Text>
            <Text style={typography.h3}>{formatINR(totals.net)}</Text>
          </Card>
          <Card style={styles.kpi}>
            <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>SUCCESS</Text>
            <Text style={typography.h3}>{formatINR(totals.success)}</Text>
          </Card>
          <Card style={styles.kpi}>
            <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>REFUNDED</Text>
            <Text style={typography.h3}>{formatINR(totals.refunded)}</Text>
          </Card>
        </View>
        <Input placeholder="Search by user, txn id, description" value={q} onChangeText={setQ} leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted}/>}/>
        <View style={styles.chips}>
          {STATUS_FILTERS.map((f) => {
            const sel = filter === f.key;
            return (<Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, sel && styles.chipActive]}>
                <Text style={[styles.chipText, sel && styles.chipTextActive]}>{f.label}</Text>
              </Pressable>);
        })}
        </View>
      </View>
      <FlatList data={data} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} renderItem={({ item }) => (<Card style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={[styles.gateway, { backgroundColor: item.gateway === 'stripe' ? '#635BFF22' : '#0B85FF22' }]}>
                <Text style={{ ...typography.small, fontWeight: '700', color: item.gateway === 'stripe' ? '#635BFF' : '#0B85FF' }}>
                  {item.gateway === 'stripe' ? 'S' : 'R'}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={typography.bodyBold}>{item.user}</Text>
                <Text style={{ ...typography.small, color: colors.textMuted }}>{item.description}</Text>
                <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 2 }}>
                  {new Date(item.date).toLocaleString()} {'\u00B7'} {item.method}
                </Text>
                <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 2 }}>{item.txnId}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={typography.bodyBold}>{formatINR(item.amount)}</Text>
                <View style={{ marginTop: spacing.xs }}>
                  <Badge label={item.status} tone={tone(item.status)}/>
                </View>
              </View>
            </View>
          </Card>)}/>
    </Screen>);
}
const styles = StyleSheet.create({
    kpis: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    kpi: { flex: 1 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.small, color: colors.text, fontWeight: '600' },
    chipTextActive: { color: colors.textInverse },
    gateway: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
