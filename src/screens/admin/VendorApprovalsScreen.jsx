import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card, Badge } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { Routes } from '@/constants/routes';
import { vendorApprovals } from '@/services/adminMockData';
const FILTERS = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
];
function toneFor(status) {
    return status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning';
}
export default function VendorApprovalsScreen() {
    const nav = useNavigation();
    const [filter, setFilter] = useState('pending');
    const data = useMemo(() => vendorApprovals.filter((v) => filter === 'all' || v.status === filter), [filter]);
    return (<Screen>
      <ScreenHeader title="Vendor approvals" subtitle={`${data.length} in queue`} showBack/>
      <View style={styles.chips}>
        {FILTERS.map((f) => {
            const sel = filter === f.key;
            return (<Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, sel && styles.chipActive]}>
              <Text style={[styles.chipText, sel && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>);
        })}
      </View>
      <FlatList data={data} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} renderItem={({ item }) => (<Pressable onPress={() => nav.navigate(Routes.AdminVendorApprovalDetail, { id: item.id })}>
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={styles.logo}>
                  <Ionicons name="business-outline" size={22} color={colors.primary}/>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={typography.bodyBold}>{item.companyName}</Text>
                  <Text style={{ ...typography.small, color: colors.textMuted }}>
                    {item.ownerName} {'\u00B7'} {item.city}, {item.state}
                  </Text>
                  <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 2 }}>
                    {item.documents.length} document{item.documents.length === 1 ? '' : 's'} {'\u00B7'} submitted {new Date(item.submittedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Badge label={item.status} tone={toneFor(item.status)}/>
              </View>
            </Card>
          </Pressable>)} ListEmptyComponent={<Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }}>Nothing in this queue.</Text>}/>
    </Screen>);
}
const styles = StyleSheet.create({
    chips: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.small, color: colors.text, fontWeight: '600' },
    chipTextActive: { color: colors.textInverse },
    logo: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
});
