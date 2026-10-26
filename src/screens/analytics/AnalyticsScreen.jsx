import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
const vendorMetrics = [
    { label: 'Profile views', value: '0', delta: '+0%', positive: true },
    { label: 'Listing views', value: '0', delta: '+0%', positive: true },
    { label: 'Leads generated', value: '0', delta: '+0%', positive: true },
    { label: 'Conversion rate', value: '0%', delta: '+0%', positive: true },
];
const platformMetrics = [
    { label: 'Monthly active users', value: '0' },
    { label: 'Registered users', value: '0' },
    { label: 'Active vendors', value: '0' },
    { label: 'Revenue (MTD)', value: '\u20B90' },
];
export default function AnalyticsScreen() {
    return (<Screen>
      <ScreenHeader title="Analytics" subtitle="Performance overview" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <Text style={styles.section}>Vendor performance</Text>
        <View style={styles.grid}>
          {vendorMetrics.map((m) => (<Card key={m.label} style={styles.metricCard}>
              <Text style={styles.value}>{m.value}</Text>
              <Text style={styles.label}>{m.label}</Text>
              <View style={styles.deltaRow}>
                <Ionicons name={m.positive ? 'arrow-up' : 'arrow-down'} size={14} color={m.positive ? colors.success : colors.danger}/>
                <Text style={[styles.delta, { color: m.positive ? colors.success : colors.danger }]}>{m.delta}</Text>
              </View>
            </Card>))}
        </View>

        <Text style={[styles.section, { marginTop: spacing.lg }]}>Leads trend (last 7 days)</Text>
        <Card>
          <View style={styles.chartBars}>
            {[12, 18, 9, 22, 15, 28, 21].map((v, i) => (<View key={i} style={styles.chartCol}>
                <View style={[styles.chartBar, { height: v * 3.2 }]}/>
                <Text style={styles.chartLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
              </View>))}
          </View>
        </Card>

        <Text style={[styles.section, { marginTop: spacing.lg }]}>Platform metrics</Text>
        <View style={styles.grid}>
          {platformMetrics.map((m) => (<Card key={m.label} style={styles.metricCard}>
              <Text style={styles.value}>{m.value}</Text>
              <Text style={styles.label}>{m.label}</Text>
            </Card>))}
        </View>

        <Text style={[styles.section, { marginTop: spacing.lg }]}>Top performing services</Text>
        {['3BHK Architecture Package', 'PMC Consultancy', 'Civil Construction G+1'].map((n, i) => (<Card key={n} style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.rank}><Text style={{ color: colors.textInverse, fontWeight: '700' }}>{i + 1}</Text></View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={typography.bodyBold}>{n}</Text>
              <View style={{ height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, marginTop: 6 }}>
                <View style={{ height: 6, backgroundColor: colors.primary, borderRadius: 3, width: `${90 - i * 20}%` }}/>
              </View>
            </View>
          </Card>))}
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    section: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    metricCard: { width: '48%', marginBottom: spacing.sm },
    value: { ...typography.h2, color: colors.text },
    label: { ...typography.small, color: colors.textMuted, marginTop: 2 },
    deltaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    delta: { ...typography.small, fontWeight: '700', marginLeft: 2 },
    chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, marginTop: spacing.sm },
    chartCol: { flex: 1, alignItems: 'center' },
    chartBar: { width: 18, backgroundColor: colors.primary, borderRadius: radius.sm },
    chartLabel: { ...typography.small, color: colors.textMuted, marginTop: 4 },
    rank: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
