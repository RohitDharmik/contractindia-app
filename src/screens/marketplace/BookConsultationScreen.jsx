import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Button, Input } from '@/components';
import { spacing, radius, typography } from '@/constants/sizes';
import { colors } from '@/constants/colors';
const slots = ['10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM', '06:00 PM'];
const dates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
});
export default function BookConsultationScreen() {
    const nav = useNavigation();
    const [date, setDate] = useState(dates[0]);
    const [slot, setSlot] = useState(slots[0]);
    const [mode, setMode] = useState('video');
    const [notes, setNotes] = useState('');
    return (<Screen>
      <ScreenHeader title="Book consultation" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={styles.label}>Select a date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
            {dates.map((d) => {
            const sel = d.toDateString() === date.toDateString();
            return (<Pressable key={d.toISOString()} onPress={() => setDate(d)} style={[styles.dateChip, sel && styles.dateChipActive]}>
                  <Text style={[styles.dateDay, sel && styles.invText]}>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</Text>
                  <Text style={[styles.dateNum, sel && styles.invText]}>{d.getDate()}</Text>
                </Pressable>);
        })}
          </ScrollView>
        </Card>

        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={styles.label}>Available time</Text>
          <View style={styles.slots}>
            {slots.map((s) => {
            const sel = s === slot;
            return (<Pressable key={s} onPress={() => setSlot(s)} style={[styles.slot, sel && styles.slotActive]}>
                  <Text style={[styles.slotText, sel && styles.invText]}>{s}</Text>
                </Pressable>);
        })}
          </View>
        </Card>

        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={styles.label}>Mode</Text>
          <View style={[styles.slots, { marginTop: spacing.sm }]}>
            {['video', 'phone', 'site'].map((m) => (<Pressable key={m} onPress={() => setMode(m)} style={[styles.slot, mode === m && styles.slotActive]}>
                <Text style={[styles.slotText, mode === m && styles.invText]}>
                  {m === 'video' ? 'Video call' : m === 'phone' ? 'Phone' : 'Site visit'}
                </Text>
              </Pressable>))}
          </View>
        </Card>

        <Input label="Notes for the vendor (optional)" multiline value={notes} onChangeText={setNotes} style={{ minHeight: 80, textAlignVertical: 'top' }}/>

        <Button title="Request appointment" fullWidth onPress={() => Alert.alert('Request sent', 'Vendor will confirm soon.', [{ text: 'OK', onPress: () => nav.goBack() }])}/>
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    label: { ...typography.label, color: colors.text },
    dateChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, marginRight: spacing.sm, alignItems: 'center' },
    dateChipActive: { backgroundColor: colors.primary },
    dateDay: { ...typography.small, color: colors.textMuted },
    dateNum: { ...typography.h3, color: colors.text },
    invText: { color: colors.textInverse },
    slots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
    slot: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    slotText: { ...typography.small, color: colors.text, fontWeight: '600' },
});
