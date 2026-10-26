import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Button, Input, Badge } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { isGST, isPAN } from '@/utils/validators';
import { colors } from '@/constants/colors';
import { spacing, typography, radius } from '@/constants/sizes';
const docTypes = [
    { id: 'pan', label: 'PAN Card', required: true },
    { id: 'aadhaar', label: 'Aadhaar', required: true },
    { id: 'gst', label: 'GST Certificate', required: false },
    { id: 'cin', label: 'CIN / Incorporation', required: false },
];
export default function KYCScreen() {
    const nav = useNavigation();
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const [pan, setPan] = useState('');
    const [gst, setGst] = useState('');
    const [uploaded, setUploaded] = useState({});
    const submit = () => {
        if (!isPAN(pan))
            return Alert.alert('Invalid PAN', 'Format: ABCDE1234F');
        if (gst && !isGST(gst))
            return Alert.alert('Invalid GST');
        if (user)
            setUser({ ...user, kycStatus: 'submitted' });
        Alert.alert('Submitted', 'KYC under review (24\u201348 hours).', [{ text: 'OK', onPress: () => nav.goBack() }]);
    };
    return (<Screen>
      <ScreenHeader title="KYC verification" subtitle={`Status: ${user?.kycStatus ?? 'pending'}`} showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={styles.row}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary}/>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={typography.bodyBold}>Why verify?</Text>
              <Text style={{ ...typography.small, color: colors.textMuted }}>Get the verified badge, unlock featured listings, and build trust.</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.section}>Government IDs</Text>
        <Input label="PAN" placeholder="ABCDE1234F" autoCapitalize="characters" value={pan} onChangeText={setPan} maxLength={10}/>
        <Input label="GST (optional)" placeholder="27ABCDE1234F1Z5" autoCapitalize="characters" value={gst} onChangeText={setGst}/>

        <Text style={styles.section}>Document uploads</Text>
        {docTypes.map((d) => (<Pressable key={d.id} onPress={() => setUploaded((u) => ({ ...u, [d.id]: !u[d.id] }))} style={[styles.docRow, uploaded[d.id] && { borderColor: colors.success }]}>
            <Ionicons name={uploaded[d.id] ? 'checkmark-circle' : 'cloud-upload-outline'} size={22} color={uploaded[d.id] ? colors.success : colors.primary}/>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={typography.bodyBold}>{d.label}</Text>
              <Text style={{ ...typography.small, color: colors.textMuted }}>{uploaded[d.id] ? 'Ready to submit' : 'Tap to upload'}</Text>
            </View>
            {d.required ? <Badge label="Required" tone="warning"/> : null}
          </Pressable>))}

        <Button title="Submit for review" onPress={submit} fullWidth style={{ marginTop: spacing.lg }}/>
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    section: { ...typography.label, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md },
    docRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
});
