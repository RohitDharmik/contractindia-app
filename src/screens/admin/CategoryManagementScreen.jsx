import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card, Button, Input } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { adminCategories } from '@/services/adminMockData';
export default function CategoryManagementScreen() {
    const [rows, setRows] = useState(adminCategories);
    const [name, setName] = useState('');
    const toggle = (id, key) => setRows((p) => p.map((r) => r.id === id ? { ...r, [key]: !r[key] } : r));
    const add = () => {
        const n = name.trim();
        if (!n)
            return Alert.alert('Enter category name');
        const id = n.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        setRows((p) => [{ id, name: n, icon: 'pricetag-outline', active: true, listings: 0, featured: false }, ...p]);
        setName('');
    };
    const remove = (id) => Alert.alert('Delete category', 'Listings under this category will be unassigned.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => setRows((p) => p.filter((r) => r.id !== id)) },
    ]);
    return (<Screen>
      <ScreenHeader title="Categories" subtitle={`${rows.length} total`} showBack/>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Card>
          <Text style={typography.bodyBold}>Add category</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Input placeholder="e.g. Plumbing" value={name} onChangeText={setName}/>
            </View>
            <Button title="Add" onPress={add}/>
          </View>
        </Card>
      </View>
      <FlatList data={rows} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} renderItem={({ item }) => (<Card style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.icon}><Ionicons name={item.icon} size={22} color={colors.primary}/></View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={typography.bodyBold}>{item.name}</Text>
                <Text style={{ ...typography.small, color: colors.textMuted }}>{item.listings} listings</Text>
              </View>
              <Pressable onPress={() => remove(item.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.danger}/>
              </Pressable>
            </View>
            <View style={styles.switchRow}>
              <Text style={typography.small}>Active</Text>
              <Switch value={item.active} onValueChange={() => toggle(item.id, 'active')} trackColor={{ true: colors.primary }}/>
              <Text style={[typography.small, { marginLeft: spacing.lg }]}>Featured</Text>
              <Switch value={item.featured} onValueChange={() => toggle(item.id, 'featured')} trackColor={{ true: colors.accent }}/>
            </View>
          </Card>)}/>
    </Screen>);
}
const styles = StyleSheet.create({
    icon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
});
