import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState, Input, Screen, ScreenHeader } from '@/components';
import { getServiceCatalog } from '@/api/client';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';

const VERIFICATION_FILTERS = [
    { key: 'pending', label: 'Pending' },
    { key: 'verified', label: 'Verified' },
    { key: 'all', label: 'All' },
];
const SERVICE_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
];

function listFrom(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.value)) return response.value;
    return [];
}

function serviceState(service) {
    const active = service?.IsActive ?? service?.isActive ?? service?.Active ?? service?.active;
    if (active == null) return 'unknown';
    return active === true || active === 1 || String(active).toLowerCase() === 'true' || String(active) === '1' ? 'active' : 'inactive';
}

function AdminPage({ title, subtitle, children }) {
    return <Screen>
        <ScreenHeader title={title} subtitle={subtitle} showBack/>
        {children}
    </Screen>;
}

function ContractNotice({ children }) {
    return <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={18} color={colors.warning}/>
        <Text style={styles.noticeText}>{children}</Text>
    </View>;
}

function FilterTabs({ value, options, onChange }) {
    return <View style={styles.filters}>
        {options.map((option) => {
            const selected = value === option.key;
            return <Pressable key={option.key} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => onChange(option.key)} style={[styles.filter, selected && styles.filterSelected]}>
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{option.label}</Text>
            </Pressable>;
        })}
    </View>;
}

function Summary({ label, icon }) {
    return <Card style={styles.summary}>
        <Ionicons name={icon} size={18} color={colors.primary}/>
        <Text style={styles.summaryValue}>--</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
    </Card>;
}
 

export function UserReviewScreen({ route }) {
    const params = route?.params ?? {};
    const user = params.userRow ?? {};
    const fields = [
        ['Name', user.Name ?? user.name],
        ['Email', user.EmailId ?? user.email],
        ['Mobile', user.MobileNo ?? user.mobile],
        ['User type', user.UserTypeName ?? user.userType],
        ['Application ID', params.applicationId ?? user.UserID ?? user.userId],
        ['Requested action', params.actionType],
    ].filter(([, value]) => value != null && value !== '');
    return <AdminPage title="User review" subtitle="Application details">
        <ScrollView contentContainerStyle={styles.content}>
            {fields.length ? <Card style={styles.detailCard}>
                {fields.map(([label, value]) => <View key={label} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{label}</Text>
                    <Text style={styles.detailValue}>{String(value)}</Text>
                </View>)}
            </Card> : null}
            <ContractNotice>User data and approval actions require a server-authorized admin session. This screen does not approve or reject applications.</ContractNotice>
            {!fields.length ? <EmptyState icon="person-circle-outline" title="Review details unavailable" body="Open this route with an application ID and review data to inspect an application."/> : null}
        </ScrollView>
    </AdminPage>;
}

export function ServiceManagementScreen() {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const loadServices = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true);
        else setLoading(true);
        setError('');
        try {
            setServices(listFrom(await getServiceCatalog()));
        } catch (requestError) {
            setError(requestError?.message || 'Could not load the service catalog.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);
    useEffect(() => {
        loadServices();
    }, [loadServices]);
    const filteredServices = useMemo(() => services.filter((service) => {
        const name = service?.ServiceName ?? service?.serviceName ?? service?.Name ?? service?.name ?? '';
        const id = service?.ServiceID ?? service?.serviceId ?? service?.ID ?? service?.id ?? '';
        const matchesQuery = `${name} ${id}`.toLowerCase().includes(query.trim().toLowerCase());
        return matchesQuery && (filter === 'all' || serviceState(service) === filter);
    }), [services, query, filter]);
    const emptyContent = loading
        ? <View style={styles.loading}><ActivityIndicator color={colors.primary}/><Text style={styles.count}>Loading service catalog...</Text></View>
        : error
            ? <EmptyState icon="cloud-offline-outline" title="Catalog unavailable" body={error} action={<Pressable onPress={() => loadServices()} style={styles.retry}><Ionicons name="refresh-outline" size={16} color={colors.primary}/><Text style={styles.retryText}>Try again</Text></Pressable>}/>
            : <EmptyState icon="construct-outline" title="No services found" body={query ? 'Try another search term or filter.' : 'No service records were returned.'}/>;
    return <AdminPage title="Service  " subtitle="Service catalog" >
        <FlatList
            data={filteredServices}
            keyExtractor={(item, index) => String(item?.ServiceID ?? item?.serviceId ?? item?.ID ?? item?.id ?? index)}
            contentContainerStyle={styles.content}
            ListHeaderComponent={<>
                <View style={styles.toolbar}>
                    <Text style={styles.sectionTitle}>Catalog services</Text>
                    <Pressable onPress={() => loadServices(true)} accessibilityRole="button" accessibilityLabel="Refresh service catalog" style={styles.refresh}>
                        <Ionicons name="refresh-outline" size={19} color={colors.primary}/>
                    </Pressable>
                </View>
                <Input placeholder="Search services" value={query} onChangeText={setQuery} leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted}/>}/>
                <FilterTabs value={filter} options={SERVICE_FILTERS} onChange={setFilter}/>
                <ContractNotice>The catalog is read-only here. Changes require a server-authorized admin session.</ContractNotice>
                {services.length ? <Text style={styles.count}>{filteredServices.length} of {services.length} services</Text> : null}
            </>}
            ListEmptyComponent={emptyContent}
            refreshing={refreshing}
            onRefresh={() => loadServices(true)}
            renderItem={({ item }) => {
                const name = item?.ServiceName ?? item?.serviceName ?? item?.Name ?? item?.name ?? 'Unnamed service';
                const id = item?.ServiceID ?? item?.serviceId ?? item?.ID ?? item?.id;
                const status = serviceState(item);
                return <Card style={styles.serviceCard}>
                    <View style={styles.serviceIcon}><Ionicons name="construct-outline" size={19} color={colors.primary}/></View>
                    <View style={styles.serviceCopy}>
                        <Text style={styles.serviceName}>{String(name)}</Text>
                        <Text style={styles.count}>{id == null ? 'Service ID unavailable' : `ID ${id}`}</Text>
                    </View>
                    <Text style={[styles.serviceStatus, status === 'active' && styles.activeStatus]}>{status === 'unknown' ? 'Unknown' : status}</Text>
                </Card>;
            }}
        />
    </AdminPage>;
}

export function SecurityScreen() {
    const controls = [
        { title: 'Role access', detail: 'Server-enforced admin roles', icon: 'shield-checkmark-outline' },
        { title: 'Audit history', detail: 'Administrative change log', icon: 'reader-outline' },
        { title: 'Session controls', detail: 'Active sessions and revocation', icon: 'key-outline' },
    ];
    return <AdminPage title="Security" subtitle="Access and audit controls">
        <ScrollView contentContainerStyle={styles.content}>
            <ContractNotice>Security settings and audit APIs are not defined for the mobile client. These rows describe control areas, not live system status.</ContractNotice>
            {controls.map((control) => <Card key={control.title} style={styles.controlCard}>
                <View style={styles.controlIcon}><Ionicons name={control.icon} size={19} color={colors.primary}/></View>
                <View style={styles.controlCopy}>
                    <Text style={styles.controlTitle}>{control.title}</Text>
                    <Text style={styles.controlDetail}>{control.detail}</Text>
                </View>
                <Text style={styles.unavailable}>Unavailable</Text>
            </Card>)}
        </ScrollView>
    </AdminPage>;
}

export function DocumentSubcategoriesScreen() {
    const [query, setQuery] = useState('');
    return <AdminPage title="Document subcategories" subtitle="Document taxonomy">
        <ScrollView contentContainerStyle={styles.content}>
            <Input placeholder="Search subcategories" value={query} onChangeText={setQuery} leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted}/>}/>
            <ContractNotice>Subcategory records and changes require server-authorized admin access. No unfiltered taxonomy data is requested.</ContractNotice>
            <EmptyState icon="folder-open-outline" title="Subcategories unavailable" body={query ? 'No records are loaded to search.' : 'Authorized subcategory records will appear here.'}/>
        </ScrollView>
    </AdminPage>;
}

const styles = StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
    summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    summary: { flex: 1, minHeight: 94, padding: spacing.md },
    summaryValue: { ...typography.h3, color: colors.text, marginTop: spacing.xs },
    summaryLabel: { ...typography.small, color: colors.textMuted },
    filters: { flexDirection: 'row', gap: spacing.xs, padding: spacing.xs, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, marginBottom: spacing.md },
    filter: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
    filterSelected: { backgroundColor: colors.surface },
    filterText: { ...typography.small, color: colors.textMuted, fontWeight: '600' },
    filterTextSelected: { color: colors.primary },
    notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderWidth: 1, borderColor: '#FDE68A', borderRadius: radius.md, padding: spacing.md, backgroundColor: '#FFFBEB', marginBottom: spacing.md },
    noticeText: { ...typography.small, color: colors.text, flex: 1 },
    toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    sectionTitle: { ...typography.h3, color: colors.text },
    count: { ...typography.small, color: colors.textMuted },
    detailCard: { marginBottom: spacing.md },
    detailRow: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    detailLabel: { ...typography.small, color: colors.textMuted },
    detailValue: { ...typography.bodyBold, color: colors.text, marginTop: 2 },
    controlCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
    controlIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    controlCopy: { flex: 1 },
    controlTitle: { ...typography.bodyBold, color: colors.text },
    controlDetail: { ...typography.small, color: colors.textMuted, marginTop: 2 },
    unavailable: { ...typography.small, color: colors.textMuted },
    loading: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
    retry: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
    retryText: { ...typography.small, color: colors.primary, fontWeight: '700' },
    refresh: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    serviceCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
    serviceIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    serviceCopy: { flex: 1 },
    serviceName: { ...typography.bodyBold, color: colors.text },
    serviceStatus: { ...typography.small, color: colors.textMuted, textTransform: 'capitalize' },
    activeStatus: { color: colors.success },
});