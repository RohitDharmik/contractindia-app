import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Avatar } from '@/components';
import { mockChatMessages } from '@/services/mockData';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
export default function ChatRoomScreen() {
    const route = useRoute();
    const threadId = route.params?.threadId;
    const name = route.params?.name ?? 'Conversation';
    const initial = mockChatMessages[threadId] ?? [];
    const [messages, setMessages] = useState(initial);
    const [text, setText] = useState('');
    const send = () => {
        if (!text.trim())
            return;
        const m = { id: `m-${Date.now()}`, threadId, fromMe: true, text, createdAt: new Date().toISOString() };
        setMessages((p) => [...p, m]);
        setText('');
        setTimeout(() => {
            setMessages((p) => [
                ...p,
                { id: `m-${Date.now() + 1}`, threadId, fromMe: false, text: 'Noted. Sharing details shortly.', createdAt: new Date().toISOString() },
            ]);
        }, 800);
    };
    return (<Screen>
      <ScreenHeader title={name} showBack right={<View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Ionicons name="call-outline" size={22} color={colors.text}/>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text}/>
          </View>}/>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList data={messages} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.lg }} renderItem={({ item }) => (<View style={[styles.row, item.fromMe ? styles.right : styles.left]}>
              {!item.fromMe ? <Avatar name={name} size={28}/> : null}
              <Card style={[styles.bubble, item.fromMe ? styles.me : styles.them]}>
                <Text style={[typography.body, { color: item.fromMe ? colors.textInverse : colors.text }]}>{item.text}</Text>
              </Card>
            </View>)}/>
        <View style={styles.bar}>
          <Pressable hitSlop={10}><Ionicons name="attach-outline" size={22} color={colors.textMuted}/></Pressable>
          <TextInput value={text} onChangeText={setText} placeholder="Type a message..." placeholderTextColor={colors.textMuted} style={styles.input}/>
          <Pressable onPress={send} style={styles.send}>
            <Ionicons name="send" size={18} color={colors.textInverse}/>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>);
}
const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.sm },
    left: { justifyContent: 'flex-start' },
    right: { justifyContent: 'flex-end' },
    bubble: { maxWidth: '78%' },
    me: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
    them: { backgroundColor: colors.surface },
    bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    input: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10, ...typography.body, color: colors.text },
    send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
