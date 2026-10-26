import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card, Badge, Input, Button } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { adminUsers } from '@/services/adminMockData';
const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'pending', label: 'Pending' },
    { key: 'suspended', label: 'Suspended' },
    { key: 'deleted', label: 'Deleted' },
];
function toneFor(status) {
    switch (status) {
        case 'active': return 'success';
        case 'pending': return 'warning';
        case 'suspended': return 'danger';
        case 'deleted': return 'default';
    }
}
export default function UserManagementScreen() {
    const [filter, setFilter] = useState('all');
    const [q, setQ] = useState('');
    const [rows, setRows] = useState(adminUsers);
    const data = useMemo(() => {
        const s = q.trim().toLowerCase();
        return rows.filter((r) => {
            if (filter !== 'all' && r.status !== filter)
                return false;
            if (!s)
                return true;
            return r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s) || r.mobile.includes(s);
        });
    }, [rows, filter, q]);
    const act = (u, action) => {
        Alert.alert(`${action[0]?.toUpperCase()}${action.slice(1)} user`, `${action} ${u.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm', style: action === 'delete' ? 'destructive' : 'default',
                onPress: () => setRows((p) => p.map((x) => x.id === u.id ? {
                    ...x,
                    status: action === 'suspend' ? 'suspended' : action === 'activate' ? 'active' : 'deleted',
                } : x)),
            },
        ]);
    };
    return (<Screen>
      <ScreenHeader title="User management" subtitle={`${data.length} users`} showBack/>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
        <Input placeholder="Search by name, email, mobile" value={q} onChangeText={setQ} leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted}/>}/>
        <View style={styles.chips}>
          {FILTERS.map((f) => {
            const sel = filter === f.key;
            return (<Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, sel && styles.chipActive]}>
                <Text style={[styles.chipText, sel && styles.chipTextActive]}>{f.label}</Text>
              </Pressable>);
        })}
        </View>
      </View>
      <FlatList data={data} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} renderItem={({ item }) => (<Card style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{item.name}</Text>
                <Text style={{ ...typography.small, color: colors.textMuted }}>{item.email}</Text>
                <Text style={{ ...typography.small, color: colors.textMuted }}>{item.mobile} {'\u00B7'} {item.city}</Text>
              </View>
              <Badge label={item.status} tone={toneFor(item.status)}/>
            </View>
            <View style={styles.metaRow}>
              <Meta label="Role" value={item.role}/>
              <Meta label="Plan" value={item.plan.replace('_', ' ')}/>
              <Meta label="Credits" value={String(item.credits)}/>
              <Meta label="Joined" value={item.joinedAt}/>
            </View>
            <View style={styles.actions}>
              {item.status !== 'suspended' && (<Button title="Suspend" size="sm" variant="outline" onPress={() => act(item, 'suspend')}/>)}
              {item.status === 'suspended' && (<Button title="Activate" size="sm" variant="primary" onPress={() => act(item, 'activate')}/>)}
              <Button title="Delete" size="sm" variant="danger" onPress={() => act(item, 'delete')}/>
            </View>
          </Card>)} ListEmptyComponent={<Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }}>No users match the filter.</Text>}/>
    </Screen>);
}
function Meta({ label, value }) {
    return (<View style={{ marginRight: spacing.md, marginTop: spacing.xs }}>
      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>{label?.toUpperCase()}</Text>
      <Text style={{ ...typography.small, color: colors.text, fontWeight: '600' }}>{value}</Text>
    </View>);
}
const styles = StyleSheet.create({
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs, marginBottom: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.small, color: colors.text, fontWeight: '600' },
    chipTextActive: { color: colors.textInverse },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
