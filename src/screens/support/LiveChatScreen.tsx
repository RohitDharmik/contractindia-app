import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card, Avatar } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';

interface Msg { id: string; fromMe: boolean; text: string }

const seed: Msg[] = [
  { id: '1', fromMe: false, text: 'Hi! You are connected with ContractsIndia Support. How can we help?' },
];

export default function LiveChatScreen() {
  const [items, setItems] = useState<Msg[]>(seed);
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim()) return;
    const m = { id: `m-${Date.now()}`, fromMe: true, text };
    setItems((p) => [...p, m]);
    setText('');
    setTimeout(() => {
      setItems((p) => [...p, { id: `m-${Date.now() + 1}`, fromMe: false, text: 'Thanks. A specialist will respond shortly.' }]);
    }, 700);
  };

  return (
    <Screen>
      <ScreenHeader title="Live chat" subtitle="Average response \u2248 2 min" showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => (
            <View style={[styles.row, item.fromMe ? styles.right : styles.left]}>
              {!item.fromMe ? <Avatar name="CI Support" size={28} /> : null}
              <Card style={[styles.bubble, item.fromMe ? styles.me : styles.them]}>
                <Text style={[typography.body, { color: item.fromMe ? colors.textInverse : colors.text }]}>{item.text}</Text>
              </Card>
            </View>
          )}
        />
        <View style={styles.bar}>
          <TextInput value={text} onChangeText={setText} placeholder="Type a message..." placeholderTextColor={colors.textMuted} style={styles.input} />
          <Pressable onPress={send} style={styles.send}><Ionicons name="send" size={18} color={colors.textInverse} /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.sm },
  left: { justifyContent: 'flex-start' }, right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%' },
  me: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  them: { backgroundColor: colors.surface },
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10, ...typography.body, color: colors.text },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
