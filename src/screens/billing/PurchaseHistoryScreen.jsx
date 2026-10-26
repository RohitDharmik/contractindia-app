import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card, Badge } from '@/components';
import { mockPurchaseHistory } from '@/services/mockData';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { formatINR } from '@/utils/formatters';
const toneByStatus = {
    success: 'success',
    pending: 'warning',
    failed: 'danger',
};
export default function PurchaseHistoryScreen() {
    return (<Screen>
      <ScreenHeader title="Purchase history" showBack/>
      <FlatList data={mockPurchaseHistory} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} renderItem={({ item }) => (<Card style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.icon}><Ionicons name="receipt-outline" size={22} color={colors.primary}/></View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={typography.bodyBold}>{item.description}</Text>
              <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 2 }}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={typography.bodyBold}>{formatINR(item.amount)}</Text>
              <Badge label={item.status} tone={toneByStatus[item.status]}/>
            </View>
          </Card>)}/>
    </Screen>);
}
const styles = StyleSheet.create({
    icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
});
