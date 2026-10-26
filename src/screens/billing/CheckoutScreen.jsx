import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen, ScreenHeader, Card, Button } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { formatINR } from '@/utils/formatters';
const methods = [
    { id: 'upi', name: 'UPI', body: 'PhonePe, GPay, Paytm', icon: 'qr-code-outline' },
    { id: 'card', name: 'Credit / Debit Card', body: 'Visa, MasterCard, RuPay', icon: 'card-outline' },
    { id: 'netbanking', name: 'Netbanking', body: 'All major banks', icon: 'business-outline' },
    { id: 'wallet', name: 'Wallet', body: 'Paytm, Amazon Pay', icon: 'wallet-outline' },
];
export default function CheckoutScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const { title, amount, onSuccess } = route.params ?? {};
    const [method, setMethod] = useState('upi');
    const [loading, setLoading] = useState(false);
    const pay = async () => {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 1200));
        setLoading(false);
        onSuccess?.();
        Alert.alert('Payment successful', 'Thank you. Your purchase is complete.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    };
    return (<Screen>
      <ScreenHeader title="Checkout" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={{ ...typography.small, color: colors.textMuted }}>Order summary</Text>
          <View style={styles.row}><Text style={typography.body}>{title}</Text><Text style={typography.bodyBold}>{formatINR(amount ?? 0)}</Text></View>
          <View style={styles.row}><Text style={typography.body}>GST (18%)</Text><Text style={typography.body}>{formatINR(Math.round((amount ?? 0) * 0.18))}</Text></View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
            <Text style={typography.bodyBold}>Total</Text>
            <Text style={{ ...typography.h3, color: colors.primary }}>{formatINR(Math.round((amount ?? 0) * 1.18))}</Text>
          </View>
        </Card>

        <Text style={{ ...typography.label, color: colors.text, marginBottom: spacing.sm }}>Payment method</Text>
        {methods.map((m) => (<Pressable key={m.id} onPress={() => setMethod(m.id)} style={[styles.method, method === m.id && styles.methodActive]}>
            <Ionicons name={m.icon} size={22} color={method === m.id ? colors.primary : colors.textMuted}/>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={typography.bodyBold}>{m.name}</Text>
              <Text style={{ ...typography.small, color: colors.textMuted }}>{m.body}</Text>
            </View>
            <Ionicons name={method === m.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={method === m.id ? colors.primary : colors.textMuted}/>
          </Pressable>))}

        <View style={styles.poweredRow}>
          <Ionicons name="lock-closed" size={12} color={colors.textMuted}/>
          <Text style={{ ...typography.small, color: colors.textMuted, marginLeft: 4 }}>Secured via Razorpay  \u00B7  PCI-DSS compliant</Text>
        </View>

        <Button title={`Pay ${formatINR(Math.round((amount ?? 0) * 1.18))}`} loading={loading} onPress={pay} fullWidth/>
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
    method: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
    methodActive: { borderColor: colors.primary, backgroundColor: '#EEF3FA' },
    poweredRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.lg },
});
