import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card, Badge, Button, Input } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { vendorApprovals } from '@/services/adminMockData';
export default function VendorApprovalDetailScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const id = route.params?.id;
    const v = vendorApprovals.find((x) => x.id === id) ?? vendorApprovals[0];
    const [reason, setReason] = useState('');
    const decide = (action) => {
        if (action === 'rejected' && !reason.trim())
            return Alert.alert('Reason required', 'Please add a rejection reason.');
        Alert.alert(action === 'approved' ? 'Vendor approved' : 'Vendor rejected', `${v.companyName} has been ${action}.`, [{ text: 'OK', onPress: () => nav.goBack() }]);
    };
    return (<Screen>
      <ScreenHeader title="Vendor review" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.logo}><Ionicons name="business-outline" size={26} color={colors.primary}/></View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={typography.h3}>{v.companyName}</Text>
              <Text style={{ ...typography.small, color: colors.textMuted }}>{v.ownerName}</Text>
            </View>
            <Badge label={v.status} tone={v.status === 'pending' ? 'warning' : v.status === 'approved' ? 'success' : 'danger'}/>
          </View>
          <View style={styles.kv}>
            <KV label="City" value={`${v.city}, ${v.state}`}/>
            <KV label="Submitted" value={new Date(v.submittedAt).toLocaleString()}/>
            {v.gst && <KV label="GST" value={v.gst}/>}
            {v.pan && <KV label="PAN" value={v.pan}/>}
          </View>
        </Card>

        <Text style={styles.section}>Documents ({v.documents.length})</Text>
        {v.documents.map((d) => (<Card key={d.id} style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.docIcon}><Ionicons name="document-text-outline" size={20} color={colors.primary}/></View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={typography.bodyBold}>{d.name}</Text>
              <Text style={{ ...typography.small, color: colors.textMuted }}>{d.type}</Text>
            </View>
            <Button title="View" size="sm" variant="ghost" onPress={() => Alert.alert('Open document', d.name)}/>
          </Card>))}

        <Text style={styles.section}>Rejection reason (required to reject)</Text>
        <Input placeholder="e.g. GST number mismatch with PAN" value={reason} onChangeText={setReason} multiline/>

        <View style={styles.actions}>
          <Button title="Reject" variant="outline" onPress={() => decide('rejected')} style={{ flex: 1 }}/>
          <Button title="Approve" variant="primary" onPress={() => decide('approved')} style={{ flex: 1 }}/>
        </View>
      </ScrollView>
    </Screen>);
}
function KV({ label, value }) {
    return (<View style={{ marginRight: spacing.lg, marginTop: spacing.sm }}>
      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>{label?.toUpperCase()}</Text>
      <Text style={{ ...typography.small, color: colors.text, fontWeight: '600' }}>{value}</Text>
    </View>);
}
const styles = StyleSheet.create({
    logo: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    kv: { flexDirection: 'row', flexWrap: 'wrap' },
    section: { ...typography.label, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
    docIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
});
