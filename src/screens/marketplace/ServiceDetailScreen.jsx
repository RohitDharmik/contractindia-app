import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Badge, RatingStars, Button, Avatar } from '@/components';
import { mockServices, mockCompanies, mockReviews } from '@/services/mockData';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { formatINR, formatRelativeTime } from '@/utils/formatters';
import { useCreditsStore } from '@/store/creditsStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { Routes } from '@/constants/routes';
import { CREDIT_COSTS } from '@/constants/config';
export default function ServiceDetailScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const id = route.params?.id;
    const service = mockServices.find((s) => s.id === id);
    const company = service ? mockCompanies.find((c) => c.id === service.vendorId) : undefined;
    const [tab, setTab] = useState('overview');
    const hasContact = useCreditsStore((s) => (service ? s.hasUnlockedContact(service.vendorId) : false));
    const unlockContact = useCreditsStore((s) => s.unlockContact);
    const isUnlocking = useCreditsStore((s) => s.isUnlockingContact);
    const isFav = useFavoritesStore((s) => (service ? s.isFavorite(service.id) : false));
    const toggleFav = useFavoritesStore((s) => s.toggleFavorite);
    const toggleCompare = useFavoritesStore((s) => s.toggleCompare);
    const inCompare = useFavoritesStore((s) => (service ? s.isInCompare(service.id) : false));
    if (!service || !company) {
        return (<Screen>
        <ScreenHeader title="Not found" showBack/>
      </Screen>);
    }
    const onUnlock = async () => {
        const r = await unlockContact(service.vendorId);
        if (!r.ok) {
            Alert.alert('Unable to unlock', r.reason ?? 'Try again');
            if (r.reason === 'Insufficient credits')
                nav.navigate(Routes.Credits);
        }
    };
    return (<Screen>
      <ScreenHeader title="Service detail" showBack right={<View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable onPress={() => toggleFav(service.id)}>
              <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? colors.danger : colors.text}/>
            </Pressable>
            <Pressable onPress={() => toggleCompare(service.id)}>
              <Ionicons name={inCompare ? 'git-compare' : 'git-compare-outline'} size={22} color={inCompare ? colors.primary : colors.text}/>
            </Pressable>
          </View>}/>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <View style={styles.hero}>
            <Ionicons name="image-outline" size={48} color={colors.textMuted}/>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm }}>
            {service.featured && <Badge label="Featured" tone="accent"/>}
            {service.premium && <Badge label="Premium" tone="info"/>}
          </View>

          <Text style={styles.title}>{service.name}</Text>
          <View style={styles.metaRow}>
            <RatingStars value={service.rating}/>
            <Text style={styles.meta}>{'\u00B7 '}{service.reviewsCount} reviews</Text>
            <Text style={styles.meta}>{'\u00B7 '}{service.experienceYears} yrs exp</Text>
            <Text style={styles.meta}>{'\u00B7 '}{service.city}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINR(service.priceFrom)}</Text>
            <Text style={styles.unit}>{service.priceUnit}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['overview', 'docs', 'reviews'].map((t) => (<Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'overview' ? 'Overview' : t === 'docs' ? 'Documents' : 'Reviews'}
              </Text>
            </Pressable>))}
        </View>

        {tab === 'overview' && (<View style={{ paddingHorizontal: spacing.lg }}>
            <Section title="About this service">
              <Text style={styles.body}>{service.description}</Text>
            </Section>
            <Section title="Deliverables">
              {service.deliverables.map((d) => (<View key={d} style={styles.li}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success}/>
                  <Text style={styles.body}>{d}</Text>
                </View>))}
            </Section>
            <Section title="Tags">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {service.tags.map((t) => <Badge key={t} label={t}/>)}
              </View>
            </Section>
            <Section title="Provider">
              <Pressable onPress={() => nav.navigate(Routes.CompanyProfile, { id: company.id })}>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar name={company.name} size={44}/>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={styles.companyName}>{company.name}</Text>
                      <Text style={styles.meta}>{company.city}, {company.state}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted}/>
                  </View>
                </Card>
              </Pressable>
            </Section>
          </View>)}

        {tab === 'docs' && (<View style={{ paddingHorizontal: spacing.lg }}>
            {service.documents.length === 0 ? (<Text style={[styles.body, { paddingVertical: spacing.lg }]}>No documents shared.</Text>) : (service.documents.map((d) => (<DocRow key={d.id} doc={d}/>)))}
          </View>)}

        {tab === 'reviews' && (<View style={{ paddingHorizontal: spacing.lg }}>
            {mockReviews.map((r) => (<Card key={r.id} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.companyName}>{r.authorName}</Text>
                  <Text style={styles.meta}>{formatRelativeTime(r.createdAt)}</Text>
                </View>
                <RatingStars value={r.rating} showValue={false}/>
                <Text style={[styles.body, { marginTop: 4 }]}>{r.comment}</Text>
              </Card>))}
          </View>)}
      </ScrollView>

      {/* Sticky action bar */}
      <View style={styles.actionBar}>
        {hasContact ? (<View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Contact</Text>
            <Text style={styles.contactValue}>+91 98 765 43210</Text>
          </View>) : (<Button title={`Unlock contact \u00B7 ${CREDIT_COSTS.VIEW_CONTACT} credits`} onPress={onUnlock} loading={isUnlocking} variant="primary" style={{ flex: 1 }}/>)}
        <Button title="Inquire" variant="secondary" onPress={() => nav.navigate(Routes.Inquiry, { serviceId: service.id })} style={{ marginLeft: spacing.sm }}/>
      </View>
    </Screen>);
}
function DocRow({ doc }) {
    const unlock = useCreditsStore((s) => s.unlockDocument);
    const has = useCreditsStore((s) => s.hasUnlockedDocument(doc.id));
    return (<Card style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="document-outline" size={22} color={colors.primary}/>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={{ ...typography.bodyBold, color: colors.text }}>{doc.name}</Text>
        <Text style={{ ...typography.small, color: colors.textMuted }}>{doc.sizeKb} KB {doc.premium ? '\u00B7 Premium' : ''}</Text>
      </View>
      {doc.premium && !has ? (<Pressable onPress={() => unlock(doc.id)} style={styles.docCta}>
          <Text style={styles.docCtaText}>Unlock</Text>
        </Pressable>) : (<Ionicons name="download-outline" size={22} color={colors.primary}/>)}
    </Card>);
}
function Section({ title, children }) {
    return (<View style={{ marginTop: spacing.lg }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ marginTop: spacing.sm }}>{children}</View>
    </View>);
}
const styles = StyleSheet.create({
    hero: { height: 180, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    title: { ...typography.h2, color: colors.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: spacing.xs },
    meta: { ...typography.small, color: colors.textMuted },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.md },
    price: { ...typography.h2, color: colors.primary },
    unit: { ...typography.small, color: colors.textMuted, marginLeft: 6 },
    tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
    tab: { paddingVertical: spacing.md, marginRight: spacing.xl },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: { ...typography.label, color: colors.textMuted },
    tabTextActive: { color: colors.primary },
    sectionTitle: { ...typography.h3, color: colors.text },
    body: { ...typography.body, color: colors.text, lineHeight: 21 },
    li: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    companyName: { ...typography.bodyBold, color: colors.text },
    actionBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center' },
    contactLabel: { ...typography.small, color: colors.textMuted },
    contactValue: { ...typography.h3, color: colors.primary },
    docCta: { backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
    docCtaText: { ...typography.label, color: colors.text },
});
