import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card, Badge, Button, Input } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { announcements } from '@/services/adminMockData';
const AUDIENCE = ['all', 'individual', 'commercial'];
const CHANNELS = ['push', 'in_app', 'email'];
function tone(s) {
    return s === 'sent' ? 'success' : s === 'scheduled' ? 'info' : 'warning';
}
export default function AnnouncementsScreen() {
    const [rows, setRows] = useState(announcements);
    const [composer, setComposer] = useState(false);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [audience, setAudience] = useState('all');
    const [channel, setChannel] = useState('push');
    const send = (status) => {
        if (status !== 'draft' && (!title.trim() || !body.trim())) {
            return Alert.alert('Title and body are required');
        }
        const a = {
            id: `an_${Date.now()}`,
            title: title.trim() || '(untitled)',
            body: body.trim(),
            audience,
            channel,
            status,
            ...(status === 'sent' ? { sentCount: 1000 + Math.floor(Math.random() * 50000) } : {}),
        };
        setRows((p) => [a, ...p]);
        setComposer(false);
        setTitle('');
        setBody('');
        Alert.alert('Saved', status === 'sent' ? 'Announcement sent.' : status === 'scheduled' ? 'Scheduled for delivery.' : 'Draft saved.');
    };
    return (<Screen>
      <ScreenHeader title="Announcements" subtitle="Push, in-app, email" showBack/>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
        <Button title={composer ? 'Close composer' : 'New announcement'} icon={<Ionicons name={composer ? 'close' : 'add'} size={16} color={colors.textInverse}/>} onPress={() => setComposer((p) => !p)}/>
      </View>

      {composer && (<View style={{ padding: spacing.lg }}>
          <Card>
            <Input label="Title" value={title} onChangeText={setTitle}/>
            <Input label="Body" value={body} onChangeText={setBody} multiline style={{ minHeight: 80, textAlignVertical: 'top' }}/>

            <Text style={styles.subLabel}>Audience</Text>
            <View style={styles.chips}>
              {AUDIENCE.map((a) => {
                const sel = audience === a;
                return (<Pressable key={a} onPress={() => setAudience(a)} style={[styles.chip, sel && styles.chipActive]}>
                    <Text style={[styles.chipText, sel && styles.chipTextActive]}>{a}</Text>
                  </Pressable>);
            })}
            </View>

            <Text style={styles.subLabel}>Channel</Text>
            <View style={styles.chips}>
              {CHANNELS.map((c) => {
                const sel = channel === c;
                return (<Pressable key={c} onPress={() => setChannel(c)} style={[styles.chip, sel && styles.chipActive]}>
                    <Text style={[styles.chipText, sel && styles.chipTextActive]}>{c.replace('_', '-')}</Text>
                  </Pressable>);
            })}
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <Button title="Save draft" variant="ghost" onPress={() => send('draft')} style={{ flex: 1 }}/>
              <Button title="Schedule" variant="outline" onPress={() => send('scheduled')} style={{ flex: 1 }}/>
              <Button title="Send now" onPress={() => send('sent')} style={{ flex: 1 }}/>
            </View>
          </Card>
        </View>)}

      <FlatList data={rows} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} renderItem={({ item }) => (<Card style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{item.title}</Text>
                <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 2 }}>{item.body}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
                  <Badge label={item.audience} tone="info"/>
                  <Badge label={item.channel} tone="accent"/>
                  {item.sentCount ? <Badge label={`${item.sentCount.toLocaleString()} sent`} tone="default"/> : null}
                </View>
              </View>
              <Badge label={item.status} tone={tone(item.status)}/>
            </View>
          </Card>)}/>
    </Screen>);
}
const styles = StyleSheet.create({
    subLabel: { ...typography.label, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.xs },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.small, color: colors.text, fontWeight: '600' },
    chipTextActive: { color: colors.textInverse },
});
