import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Button, Input, Badge } from '@/components';
import { mockSupportTickets } from '@/services/mockData';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { formatRelativeTime } from '@/utils/formatters';
export default function TicketDetailScreen() {
    const route = useRoute();
    const nav = useNavigation();
    const id = route.params?.id;
    const existing = mockSupportTickets.find((t) => t.id === id);
    const [subject, setSubject] = useState(existing?.subject ?? '');
    const [body, setBody] = useState('');
    if (!existing || id === 'new') {
        return (<Screen>
        <ScreenHeader title="New ticket" showBack/>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="Brief description"/>
          <Input label="Describe the issue" multiline value={body} onChangeText={setBody} style={{ minHeight: 120, textAlignVertical: 'top' }}/>
          <Button title="Submit ticket" onPress={() => { Alert.alert('Ticket submitted'); nav.goBack(); }} fullWidth/>
        </ScrollView>
      </Screen>);
    }
    return (<Screen>
      <ScreenHeader title={`Ticket #${existing.id}`} showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={typography.h3}>{existing.subject}</Text>
          <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 2 }}>{existing.category}</Text>
          <View style={{ marginTop: spacing.sm }}><Badge label={existing.status} tone="info"/></View>
        </Card>
        {existing.messages.map((m) => (<Card key={m.id} style={[styles.bubble, m.fromMe ? styles.me : styles.them]}>
            <Text style={typography.body}>{m.text}</Text>
            <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 4 }}>{formatRelativeTime(m.createdAt)}</Text>
          </Card>))}
        <Input placeholder="Type your reply\u2026" multiline value={body} onChangeText={setBody} style={{ minHeight: 80, textAlignVertical: 'top' }}/>
        <Button title="Send reply" onPress={() => { Alert.alert('Reply sent'); setBody(''); }} fullWidth/>
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    bubble: { marginBottom: spacing.sm, alignSelf: 'flex-start', maxWidth: '90%' },
    me: { alignSelf: 'flex-end', backgroundColor: '#EEF3FA' },
    them: { alignSelf: 'flex-start' },
});
