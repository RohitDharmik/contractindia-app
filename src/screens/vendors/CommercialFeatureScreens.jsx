import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState, Screen, ScreenHeader } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';

export function CompanyProfileWizardScreen() {
    const user = useAuthStore((state) => state.user);
    return <Screen>
        <ScreenHeader title="Company profile" subtitle="Commercial account" showBack/>
        <ScrollView contentContainerStyle={styles.content}>
            <Card style={styles.profile}>
                <View style={styles.icon}><Ionicons name="business-outline" size={22} color={colors.primary}/></View>
                <Text style={styles.name}>{user?.userName || user?.name || 'Your business'}</Text>
                <Text style={styles.detail}>{user?.email || 'Email not provided'}</Text>
                <Text style={styles.detail}>{user?.mobile || 'Mobile not provided'}</Text>
            </Card>
            <Text style={styles.section}>Profile sections</Text>
            {['Company information', 'Registration details', 'Services', 'Documents', 'Banking'].map((section, index) => <Card key={section} style={styles.step}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{section}</Text>
                    <Text style={styles.detail}>Editing will be enabled when save and upload contracts are confirmed.</Text>
                </View>
                <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted}/>
            </Card>)}
        </ScrollView>
    </Screen>;
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
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    profile: { marginBottom: spacing.lg },
    icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt, marginBottom: spacing.md },
    name: { ...typography.h3, color: colors.text },
    detail: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
    section: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
    step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
    stepNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    stepNumberText: { ...typography.small, fontWeight: '700', color: colors.primary },
    stepTitle: { ...typography.bodyBold, color: colors.text },
});