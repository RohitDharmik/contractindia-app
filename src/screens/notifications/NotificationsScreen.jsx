import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, EmptyState, Button } from '@/components';
import { useNotificationsStore } from '@/store/notificationsStore';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { formatRelativeTime } from '@/utils/formatters';
const iconFor = (t) => {
    switch (t) {
        case 'lead': return 'megaphone-outline';
        case 'payment': return 'card-outline';
        case 'subscription': return 'sparkles-outline';
        case 'message': return 'chatbubble-ellipses-outline';
        default: return 'notifications-outline';
    }
};
export default function NotificationsScreen() {
    const items = useNotificationsStore((s) => s.items);
    const markAllRead = useNotificationsStore((s) => s.markAllRead);
    const markRead = useNotificationsStore((s) => s.markRead);
    return (<Screen>
      <ScreenHeader title="Notifications" showBack right={<Button title="Mark all read" variant="ghost" size="sm" onPress={markAllRead}/>}/>
      <FlatList data={items} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingBottom: spacing.xxxl }} ItemSeparatorComponent={() => <View style={styles.sep}/>} ListEmptyComponent={<EmptyState icon="notifications-outline" title="You're all caught up"/>} renderItem={({ item }) => (<Pressable onPress={() => markRead(item.id)} style={[styles.row, !item.read && { backgroundColor: '#F2F7FF' }]}>
            <View style={styles.icon}><Ionicons name={iconFor(item.type)} size={20} color={colors.primary}/></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={styles.dot}/>}
          </Pressable>)}/>
    </Screen>);
}
const styles = StyleSheet.create({
    row: { flexDirection: 'row', padding: spacing.lg, alignItems: 'flex-start', gap: spacing.md },
    sep: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg + 36 + spacing.md },
    icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    title: { ...typography.bodyBold, color: colors.text },
    body: { ...typography.small, color: colors.textMuted, marginTop: 2 },
    time: { ...typography.small, color: colors.textMuted, marginTop: 4 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, marginTop: 6 },
});
