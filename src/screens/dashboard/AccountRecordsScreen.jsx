import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card, EmptyState, Screen, ScreenHeader } from '@/components';
import { useAuthStore } from '@/store/authStore'; 
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { formatINR } from '@/utils/formatters';
import { getSubscriptionHistory, getUserServices } from '../../api/api';

const CONFIG = {
    services: {
        title: 'My services',
        subtitle: 'Services linked to your account',
        load: getUserServices,
        nameFields: ['ServiceName', 'serviceName', 'Name', 'name'],
        detailFields: ['PlanName', 'planName', 'CategoryName', 'categoryName'],
        stateFields: ['Status', 'status', 'IsActive', 'isActive'],
    },
    subscriptions: {
        title: 'Subscription history',
        subtitle: 'Plans and subscription records',
        load: getSubscriptionHistory,
        nameFields: ['PlanName', 'planName', 'Name', 'name'],
        detailFields: ['EnterDate', 'enterDate', 'StartDate', 'startDate'],
        stateFields: ['Status', 'status', 'IsActive', 'isActive'],
    },
};

function valueFor(record, fields) {
    return fields.map((field) => record?.[field]).find((value) => value !== undefined && value !== null && value !== '');
}

function recordsFrom(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.value)) return response.value;
    return [];
}

export default function AccountRecordsScreen({ route }) {
    const type = route?.params?.type === 'subscriptions' ? 'subscriptions' : 'services';
    const config = CONFIG[type];
    const userId = useAuthStore((state) => state.user?.userId);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadRecords = useCallback(async (refresh = false) => {
        if (!userId) {
            setError('Your account ID is unavailable. Sign in again to view these records.');
            setRecords([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }
        if (refresh) setRefreshing(true);
        else setLoading(true);
        setError('');
        try {
            setRecords(recordsFrom(await config.load(userId)));
        } catch (requestError) {
            setError(requestError?.message || 'Could not load account records.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [config, userId]);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    return <Screen>
        <ScreenHeader title={config.title} subtitle={config.subtitle} showBack/>
        <FlatList
            data={records}
            keyExtractor={(item, index) => String(item?.ID ?? item?.Id ?? item?.id ?? `${type}-${index}`)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRecords(true)} tintColor={colors.primary}/>}
            ListEmptyComponent={loading
                ? <View style={styles.loading}><ActivityIndicator color={colors.primary}/><Text style={styles.muted}>Loading records...</Text></View>
                : <EmptyState icon={error ? 'cloud-offline-outline' : 'file-tray-outline'} title={error ? 'Records unavailable' : 'No records yet'} body={error || 'Records associated with your account will appear here.'} action={error ? <Pressable onPress={() => loadRecords()} style={styles.retry}><Ionicons name="refresh-outline" size={16} color={colors.primary}/><Text style={styles.retryText}>Try again</Text></Pressable> : null}/>}
            renderItem={({ item }) => {
                const name = valueFor(item, config.nameFields) || (type === 'services' ? 'Service' : 'Subscription');
                const detail = valueFor(item, config.detailFields);
                const rawStatus = valueFor(item, config.stateFields);
                const status = typeof rawStatus === 'boolean' ? (rawStatus ? 'Active' : 'Inactive') : rawStatus;
                const amount = item?.Amount ?? item?.amount ?? item?.Payment ?? item?.payment;
                return <Card style={styles.record}>
                    <View style={styles.recordHead}>
                        <View style={styles.icon}><Ionicons name={type === 'services' ? 'briefcase-outline' : 'calendar-outline'} size={19} color={colors.primary}/></View>
                        {status !== undefined ? <Badge label={String(status)} tone={String(status).toLowerCase() === 'active' ? 'success' : 'default'}/> : null}
                    </View>
                    <Text style={styles.name}>{String(name)}</Text>
                    {detail != null ? <Text style={styles.muted}>{String(detail)}</Text> : null}
                    {amount != null ? <Text style={styles.amount}>{formatINR(Number(amount) || 0)}</Text> : null}
                </Card>;
            }}
        />
    </Screen>;
}

const styles = StyleSheet.create({
    list: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
    loading: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl },
    muted: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
    record: { marginBottom: spacing.sm },
    recordHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    name: { ...typography.bodyBold, color: colors.text, marginTop: spacing.md },
    amount: { ...typography.bodyBold, color: colors.primary, marginTop: spacing.sm },
    retry: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
    retryText: { ...typography.small, color: colors.primary, fontWeight: '700' },
});