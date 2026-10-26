import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Badge, RatingStars, Button, Avatar, ServiceCard } from '@/components';
import { mockCompanies, mockServices } from '@/services/mockData';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { useCreditsStore } from '@/store/creditsStore';
import { Routes } from '@/constants/routes';
import { CREDIT_COSTS } from '@/constants/config';
export default function CompanyProfileScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const company = mockCompanies.find((c) => c.id === route.params?.id);
    const services = company ? mockServices.filter((s) => s.vendorId === company.id) : [];
    const [tab, setTab] = useState('overview');
    const has = useCreditsStore((s) => (company ? s.hasUnlockedContact(company.id) : false));
    const unlock = useCreditsStore((s) => s.unlockContact);
    const downloadProfile = async () => {
        const auth = require('@/store/authStore').useAuthStore.getState();
        if (!auth.user || auth.user.credits < CREDIT_COSTS.DOWNLOAD_PROFILE) {
            return Alert.alert('Insufficient credits', `${CREDIT_COSTS.DOWNLOAD_PROFILE} credits required.`);
        }
        auth.setUser({ ...auth.user, credits: auth.user.credits - CREDIT_COSTS.DOWNLOAD_PROFILE });
        Alert.alert('Downloaded', 'Company profile saved to your downloads.');
    };
    if (!company) {
        return (<Screen>
        <ScreenHeader title="Not found" showBack/>
      </Screen>);
    }
    return (<Screen>
      <ScreenHeader title="Company" showBack/>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <View style={styles.cover}/>
          <View style={styles.headerCard}>
            <Avatar name={company.name} size={64}/>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.name}>{company.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted}/>
                <Text style={styles.meta}>{company.city}, {company.state}</Text>
              </View>
              <View style={styles.metaRow}>
                <RatingStars value={company.rating}/>
                <Text style={styles.meta}>  {company.reviewsCount} reviews</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Stat label="Founded" value={String(company.yearFounded ?? '\u2014')}/>
            <Stat label="Team" value={company.employees ?? '\u2014'}/>
            <Stat label="Services" value={String(services.length)}/>
          </View>
        </View>

        <View style={styles.tabRow}>
          {['overview', 'services', 'team', 'reviews'].map((t) => (<Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t[0]?.toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>))}
        </View>

        {tab === 'overview' && (<View style={{ paddingHorizontal: spacing.lg }}>
            <Section title="About">
              <Text style={styles.body}>{company.description}</Text>
            </Section>
            <Section title="Registration">
              <Card>
                <KV label="GST" value={company.gst ?? '\u2014'}/>
                <KV label="CIN" value={company.cin ?? '\u2014'}/>
                <KV label="PAN" value={company.pan ?? '\u2014'} last/>
              </Card>
            </Section>
            <Section title="Certifications">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {(company.certifications ?? []).map((c) => <Badge key={c} label={c} tone="info"/>)}
              </View>
            </Section>
          </View>)}

        {tab === 'services' && (<View style={{ paddingHorizontal: spacing.lg }}>
            {services.length === 0 ? (<Text style={[styles.body, { paddingVertical: spacing.lg }]}>No services listed yet.</Text>) : (services.map((s) => (<ServiceCard key={s.id} service={s} onPress={() => nav.navigate(Routes.ServiceDetail, { id: s.id })}/>)))}
          </View>)}

        {tab === 'team' && (<View style={{ paddingHorizontal: spacing.lg }}>
            {(company.team ?? []).map((m) => (<Card key={m.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Avatar name={m.name} size={40}/>
                <View style={{ marginLeft: spacing.md }}>
                  <Text style={styles.body}>{m.name}</Text>
                  <Text style={[styles.body, { color: colors.textMuted, fontSize: 12 }]}>{m.role}</Text>
                </View>
              </Card>))}
          </View>)}

        {tab === 'reviews' && (<View style={{ paddingHorizontal: spacing.lg }}>
            <Text style={styles.body}>Reviews module \u2014 see service detail screen for review samples.</Text>
          </View>)}
      </ScrollView>

      <View style={styles.actionBar}>
        {has ? (<View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Contact</Text>
            <Text style={styles.contactValue}>+91 98 7654 3210</Text>
          </View>) : (<Button title={`Unlock contact \u00B7 ${CREDIT_COSTS.VIEW_CONTACT}`} onPress={() => unlock(company.id)} style={{ flex: 1 }}/>)}
        <Button title="Download" variant="outline" onPress={downloadProfile} style={{ marginLeft: spacing.sm }}/>
      </View>
    </Screen>);
}
function Stat({ label, value }) {
    return (<View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>);
}
function Section({ title, children }) {
    return (<View style={{ marginTop: spacing.lg }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ marginTop: spacing.sm }}>{children}</View>
    </View>);
}
function KV({ label, value, last }) {
    return (<View style={[styles.kv, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={styles.body}>{label}</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>{value}</Text>
    </View>);
}
const styles = StyleSheet.create({
    cover: { height: 120, backgroundColor: colors.primary, borderRadius: radius.lg, marginTop: spacing.sm },
    headerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg, marginTop: -32, borderWidth: 1, borderColor: colors.border },
    name: { ...typography.h3, color: colors.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    meta: { ...typography.small, color: colors.textMuted },
    statsRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
    stat: { flex: 1, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    statValue: { ...typography.h3, color: colors.text },
    statLabel: { ...typography.small, color: colors.textMuted },
    tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
    tab: { paddingVertical: spacing.md, marginRight: spacing.xl },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: { ...typography.label, color: colors.textMuted },
    tabTextActive: { color: colors.primary },
    sectionTitle: { ...typography.h3, color: colors.text },
    body: { ...typography.body, color: colors.text, lineHeight: 21 },
    kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
    actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center' },
    contactLabel: { ...typography.small, color: colors.textMuted },
    contactValue: { ...typography.h3, color: colors.primary },
});
