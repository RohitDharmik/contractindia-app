import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card, Button } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { formatINR } from '@/utils/formatters';
const summary = [
    { label: 'Revenue (MTD)', value: formatINR(0), delta: '+0%', icon: 'cash-outline' },
    { label: 'New users (30d)', value: '0', delta: '+0%', icon: 'person-add-outline' },
    { label: 'Vendor signups', value: '0', delta: '+0%', icon: 'business-outline' },
    { label: 'Credits sold', value: '0', delta: '+0%', icon: 'wallet-outline' },
];
const exports = [
    { label: 'Revenue report', detail: 'Razorpay + Stripe consolidated, with GST split', icon: 'cash-outline' },
    { label: 'User export', detail: 'CSV of all individual & commercial users', icon: 'people-outline' },
    { label: 'Vendor export', detail: 'KYC status, listings, performance', icon: 'business-outline' },
    { label: 'Credits ledger', detail: 'Every debit/credit movement with reason', icon: 'wallet-outline' },
    { label: 'Leads export', detail: 'Lead lifecycle, status transitions, age', icon: 'mail-outline' },
    { label: 'Bookings export', detail: 'Consultations booked, completed, no-shows', icon: 'calendar-outline' },
];
const revenueByCategory = [
    { name: 'Contractors', value: 0 },
    { name: 'Architecture', value: 0 },
    { name: 'Materials', value: 0 },
    { name: 'Interior', value: 0 },
    { name: 'Legal', value: 0 },
];
const max = Math.max(...revenueByCategory.map((r) => r.value));
export default function ReportsScreen() {
    const exportNow = (label) => Alert.alert('Export queued', `${label} will be emailed within a few minutes.`);
    return (<Screen>
      <ScreenHeader title="Reports & exports" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <View style={styles.grid}>
          {summary.map((s) => (<Card key={s.label} style={styles.kpi}>
              <Ionicons name={s.icon} size={20} color={colors.primary}/>
              <Text style={typography.h3}>{s.value}</Text>
              <Text style={{ ...typography.small, color: colors.textMuted }}>{s.label}</Text>
              <Text style={{ ...typography.small, color: colors.success, fontWeight: '700' }}>{s.delta}</Text>
            </Card>))}
        </View>

        <Text style={styles.section}>Revenue by category (₹ Lakhs)</Text>
        <Card>
          {revenueByCategory.map((r) => (<View key={r.name} style={styles.barRow}>
              <Text style={{ ...typography.small, color: colors.text, width: 96 }}>{r.name}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(r.value / max) * 100}%` }]}/>
              </View>
              <Text style={{ ...typography.small, color: colors.textMuted, width: 48, textAlign: 'right' }}>
                {r.value.toFixed(1)}L
              </Text>
            </View>))}
        </Card>

        <Text style={styles.section}>Exports</Text>
        {exports.map((e) => (<Card key={e.label} style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.icon}><Ionicons name={e.icon} size={20} color={colors.primary}/></View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={typography.bodyBold}>{e.label}</Text>
              <Text style={{ ...typography.small, color: colors.textMuted }}>{e.detail}</Text>
            </View>
            <Button title="CSV" size="sm" variant="outline" onPress={() => exportNow(e.label)}/>
          </Card>))}
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    kpi: { width: '48%', marginBottom: spacing.sm },
    section: { ...typography.label, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
    barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xs },
    barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, marginHorizontal: spacing.sm, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
    icon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
});
