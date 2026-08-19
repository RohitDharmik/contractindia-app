import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Badge, ServiceCard, Avatar } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { mockCategories, mockServices } from '@/services/mockData';
import { useNotificationsStore } from '@/store/notificationsStore';
import { CategoryChip } from '@/components';

import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import VendorDashboardScreen from '@/screens/vendors/VendorDashboardScreen';

export default function DashboardScreen() {
  const nav = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const unread = useNotificationsStore((s) => s.unreadCount());

  const email = user?.email?.toLowerCase();
  if (email === 'admin@gmail.com' || user?.role === 'admin') {
    return <AdminDashboardScreen />;
  }
  if (email === 'commercial@gmail.com' || user?.role === 'commercial') {
    return <VendorDashboardScreen />;
  }

  const featured = mockServices.filter((s) => s.featured);

  return (
    <Screen>
      <ScreenHeader
        title={`Hi, ${user?.name?.split(' ')[0] ?? 'there'} \u{1F44B}`}
        subtitle={`${user?.city ?? 'India'} \u00B7 ${user?.plan?.toUpperCase()}`}
        right={
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable onPress={() => nav.navigate(Routes.Notifications)}>
              <View>
                <Ionicons name="notifications-outline" size={24} color={colors.text} />
                {unread > 0 && <View style={styles.dot} />}
              </View>
            </Pressable>
            <Pressable onPress={() => nav.navigate(Routes.ProfileTab)}>
              <Avatar name={user?.name ?? 'U'} size={32} />
            </Pressable>
          </View>
        }
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}>
        {/* Search prompt */}
        <Pressable onPress={() => nav.navigate(Routes.Search)} style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <Text style={styles.searchText}>{'Search architects, contractors, materials\u2026'}</Text>
        </Pressable>

        {/* Credits banner */}
        <Card style={[styles.creditCard, { marginBottom: spacing.lg }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.creditLabel}>Available credits</Text>
            <Text style={styles.creditValue}>{user?.credits ?? 0}</Text>
            <Text style={styles.creditHint}>Use credits to unlock contacts & docs</Text>
          </View>
          <Pressable onPress={() => nav.navigate(Routes.Credits)} style={styles.creditCta}>
            <Text style={styles.creditCtaText}>Top up</Text>
          </Pressable>
        </Card>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <QuickAction icon="megaphone-outline" label="Leads" onPress={() => nav.navigate(Routes.LeadsTab)} />
          <QuickAction icon="heart-outline" label="Favorites" onPress={() => nav.navigate(Routes.Favorites)} />
          <QuickAction icon="git-compare-outline" label="Compare" onPress={() => nav.navigate(Routes.Compare)} />
          <QuickAction icon="sparkles-outline" label="AI Help" onPress={() => nav.navigate(Routes.AIAssistant)} />
        </View>

        {/* Categories */}
        <SectionHeader title="Browse categories" onPress={() => nav.navigate(Routes.Categories)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          {mockCategories.map((c) => (
            <CategoryChip key={c.id} category={c} variant="chip" onPress={() => nav.navigate(Routes.ServiceList, { category: c.id, title: c.name })} />
          ))}
        </ScrollView>

        {/* Featured */}
        <SectionHeader title="Featured services" onPress={() => nav.navigate(Routes.ServiceList, { title: 'Featured services' })} />
        {featured.map((s) => (
          <ServiceCard key={s.id} service={s} onPress={() => nav.navigate(Routes.ServiceDetail, { id: s.id })} />
        ))}

        {/* Become a vendor */}
        <Card style={styles.vendorBanner}>
          <View style={{ flex: 1 }}>
            <Badge label="For vendors" tone="accent" />
            <Text style={styles.vbTitle}>Get qualified leads. Daily.</Text>
            <Text style={styles.vbBody}>Upgrade to Commercial Pro to list unlimited services and feature your business.</Text>
          </View>
          <Pressable onPress={() => nav.navigate(Routes.Plans)} style={styles.vbCta}>
            <Text style={styles.vbCtaText}>Explore plans</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function QuickAction({ icon, label, onPress }: { icon: any; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.qa}>
      <View style={styles.qaIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </Pressable>
  );
}

function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress ? (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionLink}>See all</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  searchText: { ...typography.body, color: colors.textMuted },
  creditCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary },
  creditLabel: { color: '#B4C5DA', fontSize: 12, marginBottom: 2 },
  creditValue: { color: colors.textInverse, fontSize: 28, fontWeight: '800' },
  creditHint: { color: '#B4C5DA', fontSize: 12, marginTop: 2 },
  creditCta: { backgroundColor: colors.accent, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill },
  creditCtaText: { ...typography.bodyBold, color: colors.text },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  qa: { alignItems: 'center', flex: 1 },
  qaIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  qaLabel: { ...typography.small, color: colors.text, marginTop: 4 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text },
  sectionLink: { ...typography.label, color: colors.primary },
  vendorBanner: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, backgroundColor: '#FFF8E7' },
  vbTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xs },
  vbBody: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  vbCta: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, marginLeft: spacing.sm },
  vbCtaText: { ...typography.label, color: colors.textInverse },
});
