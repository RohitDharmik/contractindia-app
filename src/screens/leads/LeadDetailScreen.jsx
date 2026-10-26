import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Badge, Button, Input } from '@/components';
import { useLeadsStore } from '@/store/leadsStore';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { formatINR, formatRelativeTime } from '@/utils/formatters';
const statuses = ['new', 'assigned', 'contacted', 'negotiation', 'converted', 'closed'];
export default function LeadDetailScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const leads = useLeadsStore((s) => s.leads);
    const updateStatus = useLeadsStore((s) => s.updateStatus);
    const addNote = useLeadsStore((s) => s.addNote);
    const lead = leads.find((l) => l.id === route.params?.id);
    const [note, setNote] = useState('');
    if (!lead)
        return <Screen><ScreenHeader title="Not found" showBack/></Screen>;
    return (<Screen>
      <ScreenHeader title="Lead" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={styles.name}>{lead.buyerName}</Text>
          <Text style={styles.meta}>{formatRelativeTime(lead.createdAt)}</Text>
          <View style={{ marginTop: spacing.sm }}>
            <Badge label={lead.status?.toUpperCase()} tone="info"/>
          </View>
          <Text style={[typography.body, { marginTop: spacing.md }]}>{lead.message}</Text>
          <View style={styles.kvRow}>
            <KV icon="briefcase-outline" label="Service" value={lead.serviceName}/>
            {lead.budget ? <KV icon="wallet-outline" label="Budget" value={formatINR(lead.budget)}/> : null}
            {lead.city ? <KV icon="location-outline" label="City" value={lead.city}/> : null}
            <KV icon="call-outline" label="Mobile" value={lead.buyerMobile}/>
            {lead.buyerEmail ? <KV icon="mail-outline" label="Email" value={lead.buyerEmail}/> : null}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <Button title="Call" size="sm" variant="outline" onPress={() => Linking.openURL(`tel:${lead.buyerMobile.replace(/\s/g, '')}`)}/>
            <Button title="WhatsApp" size="sm" variant="outline" onPress={() => Linking.openURL(`https://wa.me/${lead.buyerMobile.replace(/\D/g, '')}`)}/>
            <Button title="Chat" size="sm" onPress={() => Alert.alert('Open chat with buyer')}/>
          </View>
        </Card>

        <Text style={styles.section}>Update status</Text>
        <View style={styles.statusRow}>
          {statuses.map((s) => (<Pressable key={s} onPress={() => updateStatus(lead.id, s)} style={[styles.statusChip, lead.status === s && styles.statusChipActive]}>
              <Text style={[styles.statusText, lead.status === s && styles.statusTextActive]}>{s}</Text>
            </Pressable>))}
        </View>

        <Text style={[styles.section, { marginTop: spacing.lg }]}>Notes & follow-ups</Text>
        {(lead.notes ?? []).map((n) => (<Card key={n.id} style={{ marginBottom: spacing.sm }}>
            <Text style={typography.body}>{n.text}</Text>
            <Text style={[styles.meta, { marginTop: 4 }]}>{formatRelativeTime(n.createdAt)}</Text>
          </Card>))}
        <Input placeholder="Add a note\u2026" value={note} onChangeText={setNote} multiline style={{ minHeight: 80, textAlignVertical: 'top' }}/>
        <Button title="Save note" onPress={() => { if (note.trim()) {
        addNote(lead.id, note.trim());
        setNote('');
    } }}/>
      </ScrollView>
    </Screen>);
}
function KV({ icon, label, value }) {
    return (<View style={styles.kv}>
      <Ionicons name={icon} size={16} color={colors.textMuted}/>
      <Text style={[typography.small, { color: colors.textMuted, marginLeft: 6, width: 70 }]}>{label}</Text>
      <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]}>{value}</Text>
    </View>);
}
const styles = StyleSheet.create({
    name: { ...typography.h2, color: colors.text },
    meta: { ...typography.small, color: colors.textMuted, marginTop: 2 },
    kvRow: { marginTop: spacing.md, gap: spacing.sm },
    kv: { flexDirection: 'row', alignItems: 'center' },
    section: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    statusChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    statusText: { ...typography.small, color: colors.text, fontWeight: '600', textTransform: 'capitalize' },
    statusTextActive: { color: colors.textInverse },
});
