import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Avatar, EmptyState, Badge } from '@/components';
import { mockChatThreads } from '@/services/mockData';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { formatRelativeTime, truncate } from '@/utils/formatters';
export default function ChatListScreen() {
    const nav = useNavigation();
    return (<Screen>
      <ScreenHeader title="Messages" subtitle={`${mockChatThreads.length} conversations`}/>
      <FlatList data={mockChatThreads} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingBottom: spacing.xxxl }} ItemSeparatorComponent={() => <View style={styles.sep}/>} ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="No conversations"/>} renderItem={({ item }) => (<Pressable onPress={() => nav.navigate(Routes.ChatRoom, { threadId: item.id, name: item.participantName })} style={styles.row}>
            <Avatar name={item.participantName} size={48}/>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <View style={styles.topRow}>
                <Text style={styles.name} numberOfLines={1}>{item.participantName}</Text>
                <Text style={styles.time}>{formatRelativeTime(item.lastMessageAt)}</Text>
              </View>
              <View style={styles.bottomRow}>
                <Text style={styles.preview} numberOfLines={1}>{truncate(item.lastMessage, 60)}</Text>
                {item.unreadCount > 0 ? <Badge label={String(item.unreadCount)} tone="info"/> : null}
              </View>
            </View>
          </Pressable>)}/>
    </Screen>);
}
const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    sep: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg + 48 + spacing.md },
    topRow: { flexDirection: 'row', justifyContent: 'space-between' },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
    name: { ...typography.bodyBold, color: colors.text, flex: 1 },
    time: { ...typography.small, color: colors.textMuted, marginLeft: spacing.sm },
    preview: { ...typography.small, color: colors.textMuted, flex: 1, marginRight: spacing.sm },
});
