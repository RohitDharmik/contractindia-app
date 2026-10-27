import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Badge } from '@/components';
import { mockLeads, mockServices } from '@/services/mockData';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { formatINR } from '@/utils/formatters';
export default function VendorDashboardScreen() {
    const nav = useNavigation();
    const stats = [
        { label: 'Profile views', value: '1,284', delta: '+8.4%' },
        { label: 'Listing views', value: '3,012', delta: '+12.1%' },
        { label: 'New leads', value: String(mockLeads.length), delta: '+3 today' },
        { label: 'Conversion', value: '17%', delta: '+2.1%' },
    ];
    return (<Screen>
      <ScreenHeader title="Vendor dashboard" showBack right={<Pressable onPress={() => nav.navigate(Routes.Analytics)}>
          <Ionicons name="bar-chart-outline" size={22} color={colors.text}/>
        </Pressable>}/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <View style={styles.statsGrid}>
          {stats.map((s) => (<Card key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statDelta}>{s.delta}</Text>
            </Card>))}
        </View>

        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={typography.h3}>Earnings (this month)</Text>
          <Text style={styles.earnings}>{formatINR(184500)}</Text>
          <Text style={{ ...typography.small, color: colors.textMuted }}>Net of platform fees</Text>
          <View style={styles.barRow}>
            {[40, 65, 50, 80, 70, 95, 60].map((h, i) => (<View key={i} style={[styles.bar, { height: h }]}/>))}
          </View>
        </Card>

        <SectionHeader title="Quick actions"/>
        <View style={styles.actions}>
          <ActionTile icon="briefcase-outline" label="My services" onPress={() => nav.navigate(Routes.VendorServices)}/>
          <ActionTile icon="person-circle-outline" label="Company profile" onPress={() => nav.navigate(Routes.VendorProfileWizard)}/>
          <ActionTile icon="people-outline" label="Clients" onPress={() => nav.navigate(Routes.ClientHistory)}/>
          <ActionTile icon="receipt-outline" label="Invoices" onPress={() => nav.navigate(Routes.Invoices)}/>
          <ActionTile icon="star-outline" label="Boost" onPress={() => nav.navigate(Routes.Plans)}/>
        </View>

        <SectionHeader title="My services" onPress={() => nav.navigate(Routes.VendorServices)}/>
        {mockServices.slice(0, 3).map((s) => (<Card key={s.id} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{s.name}</Text>
                <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 2 }}>{s.city}{' \u00B7 '}{s.reviewsCount} reviews</Text>
              </View>
              <Badge label={s.featured ? 'Featured' : 'Active'} tone={s.featured ? 'accent' : 'success'}/>
            </View>
          </Card>))}

        <SectionHeader title="Latest leads" onPress={() => nav.navigate(Routes.LeadsTab)}/>
        {mockLeads.slice(0, 2).map((l) => (<Card key={l.id} style={{ marginBottom: spacing.sm }}>
            <Text style={typography.bodyBold}>{l.buyerName}</Text>
            <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 2 }}>{l.serviceName}</Text>
            <Text style={[typography.body, { marginTop: spacing.xs }]} numberOfLines={2}>{l.message}</Text>
          </Card>))}
      </ScrollView>
    </Screen>);
}
function ActionTile({ icon, label, onPress }) {
    return (<Pressable onPress={onPress} style={styles.action}>
      <View style={styles.actionIcon}><Ionicons name={icon} size={22} color={colors.primary}/></View>
      <Text style={{ ...typography.small, color: colors.text, marginTop: spacing.xs, textAlign: 'center' }}>{label}</Text>
    </Pressable>);
}
function SectionHeader({ title, onPress }) {
    return (<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.sm }}>
      <Text style={typography.h3}>{title}</Text>
      {onPress ? <Pressable onPress={onPress}><Text style={{ ...typography.label, color: colors.primary }}>See all</Text></Pressable> : null}
    </View>);
}
const styles = StyleSheet.create({
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.md },
    statCard: { width: '48%', marginBottom: spacing.sm },
    statValue: { ...typography.h2, color: colors.text },
    statLabel: { ...typography.small, color: colors.textMuted, marginTop: 2 },
    statDelta: { ...typography.small, color: colors.success, marginTop: 4, fontWeight: '700' },
    earnings: { ...typography.h1, color: colors.primary, marginTop: spacing.xs },
    barRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, marginTop: spacing.md, gap: 6 },
    bar: { flex: 1, backgroundColor: colors.accent, borderRadius: radius.sm },
    actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    action: { alignItems: 'center', flex: 1 },
    actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
