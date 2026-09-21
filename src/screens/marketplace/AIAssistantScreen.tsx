import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';

interface Msg { id: string; fromMe: boolean; text: string }

const seed: Msg[] = [
  { id: 'a1', fromMe: false, text: 'Hi! I\u2019m ContractsIndia AI. I can recommend services, estimate budgets, and explain construction steps.' },
  { id: 'a2', fromMe: false, text: 'What are you working on? You can ask things like "Show me architects in Pune under \u20B91L" or "Estimate cost for a 1500 sqft G+1 build".' },
];

const suggestions = [
  'Find architects in Pune',
  'Estimate cost for 1500 sqft G+1',
  'What approvals do I need before construction?',
  'Top rated material suppliers in Hyderabad',
];

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<Msg[]>(seed);
  const [input, setInput] = useState('');

  const send = (text: string) => {
    if (!text.trim()) return;
    const me: Msg = { id: `m-${Date.now()}`, fromMe: true, text };
    setMessages((m) => [...m, me]);
    setInput('');
    setTimeout(() => {
      const reply: Msg = {
        id: `m-${Date.now() + 1}`,
        fromMe: false,
        text: 'Here are a few options I think will help. (This is a UI placeholder \u2014 wire up to your OpenAI/RAG backend.)',
      };
      setMessages((m) => [...m, reply]);
    }, 600);
  };

  return (
    <Screen>
      <ScreenHeader title="AI Assistant" subtitle="Powered by ContractsIndia AI" showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          data={messages}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => (
            <View style={[styles.row, item.fromMe ? styles.right : styles.left]}>
              <Card style={[styles.bubble, item.fromMe ? styles.me : styles.them]}>
                <Text style={[typography.body, { color: item.fromMe ? colors.textInverse : colors.text }]}>{item.text}</Text>
              </Card>
            </View>
          )}
          ListFooterComponent={
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.suggestionTitle}>Try asking</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
                {suggestions.map((s) => (
                  <Pressable key={s} onPress={() => send(s)} style={styles.sugg}>
                    <Text style={styles.suggText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
        />
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about your project..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <Pressable onPress={() => send(input)} style={styles.sendBtn}>
            <Ionicons name="send" size={18} color={colors.textInverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.sm },
  left: { alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  bubble: { maxWidth: '85%' },
  me: { backgroundColor: colors.primary },
  them: { backgroundColor: colors.surface },
  suggestionTitle: { ...typography.small, color: colors.textMuted },
  sugg: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  suggText: { ...typography.small, color: colors.text, fontWeight: '600' },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10, ...typography.body, color: colors.text },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
