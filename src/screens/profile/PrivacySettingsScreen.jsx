import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen, ScreenHeader, Card, Button } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
export default function PrivacySettingsScreen() {
    const signOut = useAuthStore((s) => s.signOut);
    const [pub, setPub] = useState(true);
    const [analytics, setAnalytics] = useState(true);
    const [personalized, setPersonalized] = useState(false);
    return (<Screen>
      <ScreenHeader title="Privacy" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card style={{ marginBottom: spacing.md }}>
          <Row label="Public profile" hint="Allow others to find your profile via search" value={pub} setValue={setPub}/>
          <Row label="Usage analytics" hint="Help us improve by sharing anonymous usage data" value={analytics} setValue={setAnalytics}/>
          <Row label="Personalized recommendations" hint="Tailor results based on your activity" value={personalized} setValue={setPersonalized} last/>
        </Card>

        <Card style={{ marginBottom: spacing.md }}>
          <Text style={typography.bodyBold}>Data export</Text>
          <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 4 }}>Download a copy of your personal data and activity.</Text>
          <Button title="Request export" variant="outline" onPress={() => Alert.alert('Request received', 'We will email you the export within 24 hours.')} style={{ marginTop: spacing.sm }}/>
        </Card>

        <Card>
          <Text style={[typography.bodyBold, { color: colors.danger }]}>Delete account</Text>
          <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 4 }}>Permanently delete your account and all associated data.</Text>
          <Button title="Delete account" variant="danger" onPress={() => Alert.alert('Confirm', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => signOut() },
        ])} style={{ marginTop: spacing.sm }}/>
        </Card>
      </ScrollView>
    </Screen>);
}
function Row({ label, hint, value, setValue, last }) {
    return (<View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={typography.body}>{label}</Text>
        <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 2 }}>{hint}</Text>
      </View>
      <Switch value={value} onValueChange={setValue} trackColor={{ true: colors.primary }}/>
    </View>);
}
const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
});
