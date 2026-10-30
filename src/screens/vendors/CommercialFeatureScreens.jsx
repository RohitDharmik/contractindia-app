import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EmptyState, Screen, ScreenHeader } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';

const PROFILE_AREAS = [
    {
        title: 'Company information',
        detail: 'Business identity and primary contact',
        icon: 'business-outline',
    },
    {
        title: 'Registration details',
        detail: 'Tax and statutory information',
        icon: 'document-text-outline',
    },
    {
        title: 'Services',
        detail: 'Categories offered by your company',
        icon: 'briefcase-outline',
    },
    {
        title: 'Documents',
        detail: 'Verification and supporting files',
        icon: 'folder-open-outline',
    },
    {
        title: 'Banking',
        detail: 'Settlement account information',
        icon: 'card-outline',
    },
];

export function CompanyProfileWizardScreen() {
    const user = useAuthStore((state) => state.user);
    return (
        <Screen>
            <ScreenHeader title="Company profile" subtitle="Commercial account" showBack />
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.hero}>
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.heroTop}>
                        <View style={styles.heroIcon}>
                            <Ionicons name="business-outline" size={23} color={colors.textInverse} />
                        </View>
                        <View style={styles.heroIdentity}>
                            <Text style={styles.heroEyebrow}>COMMERCIAL PROFILE</Text>
                            <Text style={styles.heroName} numberOfLines={2}>
                                {user?.userName || user?.name || 'Your business'}
                            </Text>
                        </View>
                        <View style={styles.accountBadge}>
                            <Ionicons name="briefcase-outline" size={13} color={colors.textInverse} />
                            <Text style={styles.accountBadgeText}>Business</Text>
                        </View>
                    </View>

                    <View style={styles.heroDetails}>
                        <View style={styles.detailRow}>
                            <Ionicons name="mail-outline" size={15} color="rgba(255,255,255,0.72)" />
                            <Text style={styles.heroDetailText} numberOfLines={1}>
                                {user?.email || 'Email not provided'}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="call-outline" size={15} color="rgba(255,255,255,0.72)" />
                            <Text style={styles.heroDetailText} numberOfLines={1}>
                                {user?.mobile || 'Mobile not provided'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.heroFooter}>
                        <View style={styles.footerStatus}>
                            <View style={styles.statusDot} />
                            <Text style={styles.footerStatusText}>Setup overview</Text>
                        </View>
                        <Text style={styles.areaCount}>{PROFILE_AREAS.length} areas</Text>
                    </View>
                </View>

                <View style={styles.sectionHeading}>
                    <View style={styles.sectionHeadingCopy}>
                        <Text style={styles.eyebrow}>PROFILE SETUP</Text>
                        <Text style={styles.sectionTitle}>Business details</Text>
                    </View>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{PROFILE_AREAS.length}</Text>
                    </View>
                </View>

                <View style={styles.areaList}>
                    {PROFILE_AREAS.map((area, index) => (
                        <View
                            key={area.title}
                            style={[
                                styles.areaRow,
                                index === PROFILE_AREAS.length - 1 && styles.areaRowLast,
                            ]}
                        >
                            <View style={styles.areaIcon}>
                                <Ionicons name={area.icon} size={19} color={colors.primary} />
                            </View>
                            <View style={styles.areaCopy}>
                                <Text style={styles.areaTitle}>{area.title}</Text>
                                <Text style={styles.areaDetail}>{area.detail}</Text>
                            </View>
                            <View style={styles.lockBadge}>
                                <Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} />
                                <Text style={styles.lockText}>Locked</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.notice}>
                    <View style={styles.noticeIcon}>
                        <Ionicons name="information-circle-outline" size={18} color={colors.info} />
                    </View>
                    <Text style={styles.noticeText}>
                        Profile editing is currently unavailable. Your account details remain unchanged.
                    </Text>
                </View>
            </ScrollView>
        </Screen>
    );
}

export function ClientHistoryScreen() {
    return <Screen>
        <ScreenHeader title="Client history" subtitle="Commercial workspace" showBack/>
        <EmptyState icon="people-outline" title="Client history unavailable" body="The client API has no confirmed account filter or response schema. No unfiltered client records are requested."/>
    </Screen>;
}

export function InvoicesScreen() {
    return <Screen>
        <ScreenHeader title="Invoices" subtitle="Commercial workspace" showBack/>
        <EmptyState icon="receipt-outline" title="No invoice source configured" body="Invoice records, receipt details, and export behavior are not available in the mobile API contract."/>
    </Screen>;
}

const styles = StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
    hero: {
        borderRadius: 18,
        padding: spacing.lg,
        overflow: 'hidden',
        backgroundColor: colors.primary,
        gap: spacing.md,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    heroIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    heroIdentity: { flex: 1, minWidth: 0 },
    heroEyebrow: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.68)', marginBottom: 4 },
    heroName: { fontSize: 19, lineHeight: 24, fontWeight: '800', color: colors.textInverse },
    accountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    accountBadgeText: { fontSize: 10, fontWeight: '700', color: colors.textInverse },
    heroDetails: { gap: spacing.sm, paddingTop: spacing.sm },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    heroDetailText: { ...typography.small, color: 'rgba(255,255,255,0.86)', flex: 1 },
    heroFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    footerStatus: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
    footerStatusText: { ...typography.small, color: colors.textInverse, fontWeight: '700' },
    areaCount: { ...typography.small, color: 'rgba(255,255,255,0.72)' },
    sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionHeadingCopy: { gap: 2 },
    eyebrow: { fontSize: 10, fontWeight: '800', color: colors.textMuted },
    sectionTitle: { ...typography.h3, color: colors.text },
    countBadge: {
        minWidth: 30,
        height: 30,
        paddingHorizontal: spacing.sm,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceAlt,
    },
    countText: { ...typography.small, color: colors.primary, fontWeight: '800' },
    areaList: {
        paddingHorizontal: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    areaRow: {
        minHeight: 76,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    areaRowLast: { borderBottomWidth: 0 },
    areaIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceAlt,
    },
    areaCopy: { flex: 1, minWidth: 0, gap: 3 },
    areaTitle: { ...typography.bodyBold, color: colors.text },
    areaDetail: { ...typography.small, color: colors.textMuted },
    lockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: colors.bg,
    },
    lockText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
    notice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
    },
    noticeIcon: { marginTop: 1 },
    noticeText: { ...typography.small, color: colors.text, flex: 1, lineHeight: 18 },
});