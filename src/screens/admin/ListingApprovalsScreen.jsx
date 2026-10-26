import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card, Badge, Button } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { formatINR } from '@/utils/formatters';
import { listingApprovals } from '@/services/adminMockData';
export default function ListingApprovalsScreen() {
    const [rows, setRows] = useState(listingApprovals);
    const decide = (l, action) => {
        Alert.alert(action === 'approved' ? 'Approve listing' : 'Reject listing', `${action[0]?.toUpperCase()}${action.slice(1)} "${l.serviceName}" by ${l.vendorName}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', onPress: () => setRows((p) => p.map((x) => x.id === l.id ? { ...x, status: action } : x)) },
        ]);
    };
    return (<Screen>
      <ScreenHeader title="Listing approvals" subtitle={`${rows.filter((r) => r.status === 'pending').length} pending`} showBack/>
      <FlatList data={rows} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} renderItem={({ item }) => (<Card style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={styles.thumb}><Ionicons name="briefcase-outline" size={22} color={colors.primary}/></View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={typography.bodyBold}>{item.serviceName}</Text>
                <Text style={{ ...typography.small, color: colors.textMuted }}>
                  {item.vendorName} {'\u00B7'} {item.category}
                </Text>
                <Text style={{ ...typography.small, color: colors.text, marginTop: 2 }}>
                  Starts at {formatINR(item.priceFrom)}
                </Text>
              </View>
              <Badge label={item.status} tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}/>
            </View>
            {item.status === 'pending' && (<View style={styles.actions}>
                <Button title="Reject" size="sm" variant="outline" onPress={() => decide(item, 'rejected')}/>
                <Button title="Approve" size="sm" variant="primary" onPress={() => decide(item, 'approved')}/>
              </View>)}
          </Card>)}/>
    </Screen>);
}
const styles = StyleSheet.create({
    thumb: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, justifyContent: 'flex-end' },
});
