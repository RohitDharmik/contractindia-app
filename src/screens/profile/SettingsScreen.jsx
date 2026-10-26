import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Card } from '@/components';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
export default function SettingsScreen() {
    const nav = useNavigation();
    const groups = [
        {
            title: 'Preferences',
            items: [
                { icon: 'language-outline', label: 'Language', value: 'English' },
                { icon: 'globe-outline', label: 'Region', value: 'India' },
                { icon: 'moon-outline', label: 'Theme', value: 'System' },
            ],
        },
        {
            title: 'Security',
            items: [
                { icon: 'notifications-outline', label: 'Notification settings', onPress: () => nav.navigate(Routes.NotificationSettings) },
                { icon: 'lock-closed-outline', label: 'Privacy settings', onPress: () => nav.navigate(Routes.PrivacySettings) },
                { icon: 'key-outline', label: 'Change password', onPress: () => nav.navigate(Routes.ChangePassword) },
            ],
        },
        {
            title: 'About',
            items: [
                { icon: 'document-text-outline', label: 'Terms of service' },
                { icon: 'shield-outline', label: 'Privacy policy' },
                { icon: 'information-circle-outline', label: 'App version', value: '1.0.0' },
            ],
        },
    ];
    return (<Screen>
      <ScreenHeader title="Settings" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {groups.map((g) => (<View key={g.title} style={{ marginBottom: spacing.lg }}>
            <Text style={styles.section}>{g.title}</Text>
            <Card style={{ padding: 0 }}>
              {g.items.map((it, i) => (<Pressable key={it.label} onPress={it.onPress} style={[styles.row, i < g.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <Ionicons name={it.icon} size={20} color={colors.primary}/>
                  <Text style={[typography.body, { flex: 1, marginLeft: spacing.md }]}>{it.label}</Text>
                  {it.value ? <Text style={{ ...typography.small, color: colors.textMuted, marginRight: spacing.sm }}>{it.value}</Text> : null}
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted}/>
                </Pressable>))}
            </Card>
          </View>))}
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    section: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase' },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
});
