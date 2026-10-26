import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Badge, Button } from '@/components';
import { mockSupportTickets } from '@/services/mockData';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { formatRelativeTime } from '@/utils/formatters';
const tone = { open: 'warning', in_progress: 'info', resolved: 'success', closed: 'default' };
export default function SupportTicketsScreen() {
    const nav = useNavigation();
    return (<Screen>
      <ScreenHeader title="Support" subtitle="Tickets & help center" showBack right={<Button title="New" size="sm" onPress={() => nav.navigate(Routes.TicketDetail, { id: 'new' })}/>}/>
      <View style={styles.quickRow}>
        <QuickLink icon="help-circle-outline" label="FAQ" onPress={() => nav.navigate(Routes.FAQ)}/>
        <QuickLink icon="book-outline" label="Knowledge base" onPress={() => nav.navigate(Routes.KnowledgeBase)}/>
        <QuickLink icon="chatbubble-ellipses-outline" label="Live chat" onPress={() => nav.navigate(Routes.LiveChat)}/>
      </View>
      <FlatList data={mockSupportTickets} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }} renderItem={({ item }) => (<Pressable onPress={() => nav.navigate(Routes.TicketDetail, { id: item.id })}>
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={typography.bodyBold} numberOfLines={1}>{item.subject}</Text>
                <Badge label={item.status.replace('_', ' ')} tone={tone[item.status]}/>
              </View>
              <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 4 }}>
                {item.category}  \u00B7  Updated {formatRelativeTime(item.updatedAt)}
              </Text>
            </Card>
          </Pressable>)}/>
    </Screen>);
}
function QuickLink({ icon, label, onPress }) {
    return (<Pressable onPress={onPress} style={styles.qlBtn}>
      <Ionicons name={icon} size={20} color={colors.primary}/>
      <Text style={styles.qlText}>{label}</Text>
    </Pressable>);
}
const styles = StyleSheet.create({
    quickRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
    qlBtn: { flex: 1, alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    qlText: { ...typography.small, color: colors.text, fontWeight: '600', marginTop: 4, textAlign: 'center' },
});
