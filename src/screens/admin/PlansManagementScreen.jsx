import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card, Button, Input } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { formatINR } from '@/utils/formatters';
import { adminPlanRows } from '@/services/adminMockData';
export default function PlansManagementScreen() {
    const [plans, setPlans] = useState(adminPlanRows);
    const [editing, setEditing] = useState(null);
    const [price, setPrice] = useState('');
    const [credits, setCredits] = useState('');
    const startEdit = (p) => {
        setEditing(p.id);
        setPrice(String(p.price));
        setCredits(String(p.credits));
    };
    const save = () => {
        if (!editing)
            return;
        const pNum = parseInt(price, 10);
        const cNum = parseInt(credits, 10);
        if (Number.isNaN(pNum) || Number.isNaN(cNum))
            return Alert.alert('Invalid', 'Enter valid numbers');
        setPlans((all) => all.map((p) => p.id === editing ? { ...p, price: pNum, credits: cNum } : p));
        setEditing(null);
        Alert.alert('Saved', 'Plan updated successfully.');
    };
    const toggleActive = (id) => setPlans((all) => all.map((p) => p.id === id ? { ...p, active: !p.active } : p));
    return (<Screen>
      <ScreenHeader title="Plans & pricing" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        {plans.map((p) => (<Card key={p.id} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.badge}>
                <Ionicons name={p.id === 'commercial_pro' ? 'briefcase' : p.id === 'premium' ? 'star' : 'leaf-outline'} size={20} color={colors.primary}/>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={typography.h3}>{p.name}</Text>
                <Text style={{ ...typography.small, color: colors.textMuted }}>{p.subscribers.toLocaleString()} subscribers</Text>
              </View>
              <Switch value={p.active} onValueChange={() => toggleActive(p.id)} trackColor={{ true: colors.primary }}/>
            </View>

            {editing === p.id ? (<View style={{ marginTop: spacing.md }}>
                <Input label="Price (INR / month)" value={price} onChangeText={setPrice} keyboardType="number-pad"/>
                <Input label="Credits included" value={credits} onChangeText={setCredits} keyboardType="number-pad"/>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button title="Cancel" variant="outline" onPress={() => setEditing(null)} style={{ flex: 1 }}/>
                  <Button title="Save" onPress={save} style={{ flex: 1 }}/>
                </View>
              </View>) : (<View style={{ marginTop: spacing.md }}>
                <View style={styles.statsRow}>
                  <Stat label="Price" value={p.price === 0 ? 'Free' : `${formatINR(p.price)}/mo`}/>
                  <Stat label="Credits" value={p.credits.toLocaleString()}/>
                  <Stat label="MRR" value={formatINR(p.price * p.subscribers)}/>
                </View>
                <Button title="Edit pricing" variant="outline" size="sm" onPress={() => startEdit(p)} style={{ alignSelf: 'flex-start', marginTop: spacing.sm }}/>
              </View>)}
          </Card>))}
      </ScrollView>
    </Screen>);
}
function Stat({ label, value }) {
    return (<View style={{ flex: 1 }}>
      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>{label?.toUpperCase()}</Text>
      <Text style={{ ...typography.bodyBold, color: colors.text }}>{value}</Text>
    </View>);
}
const styles = StyleSheet.create({
    badge: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    statsRow: { flexDirection: 'row', gap: spacing.md },
});
