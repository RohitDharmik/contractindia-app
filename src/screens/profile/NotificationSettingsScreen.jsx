import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen, ScreenHeader, Card } from '@/components';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
const items = [
    { key: 'leads', label: 'New leads' },
    { key: 'messages', label: 'Chat messages' },
    { key: 'payments', label: 'Payments & invoices' },
    { key: 'subscription', label: 'Subscription updates' },
    { key: 'marketing', label: 'Marketing & offers' },
    { key: 'system', label: 'System announcements' },
];
export default function NotificationSettingsScreen() {
    const [push, setPush] = useState({ leads: true, messages: true, payments: true, subscription: true, marketing: false, system: true });
    const [email, setEmail] = useState({ leads: true, messages: false, payments: true, subscription: true, marketing: false, system: false });
    const [sms, setSms] = useState({ leads: true, messages: false, payments: true, subscription: false, marketing: false, system: false });
    const Row = ({ label, value, setValue }) => (<View style={styles.row}>
      <Text style={typography.body}>{label}</Text>
      <Switch value={value} onValueChange={setValue} trackColor={{ true: colors.primary }}/>
    </View>);
    return (<Screen>
      <ScreenHeader title="Notification settings" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {['Push', 'Email', 'SMS'].map((channel) => {
            const map = channel === 'Push' ? push : channel === 'Email' ? email : sms;
            const setMap = channel === 'Push' ? setPush : channel === 'Email' ? setEmail : setSms;
            return (<View key={channel} style={{ marginBottom: spacing.lg }}>
              <Text style={styles.section}>{channel}</Text>
              <Card style={{ padding: 0 }}>
                {items.map((it, i) => (<View key={it.key} style={[styles.itemRow, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                    <Row label={it.label} value={map[it.key]} setValue={(v) => setMap((p) => ({ ...p, [it.key]: v }))}/>
                  </View>))}
              </Card>
            </View>);
        })}
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    section: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase' },
    itemRow: { paddingHorizontal: spacing.md },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
});
