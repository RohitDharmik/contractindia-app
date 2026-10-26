import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card, Button, Input, Badge } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import FormRenderer from '@/forms/FormRenderer';
const TYPE_OPTIONS = [
    { key: 'text', label: 'Text', icon: 'text-outline' },
    { key: 'email', label: 'Email', icon: 'mail-outline' },
    { key: 'number', label: 'Number', icon: 'calculator-outline' },
    { key: 'mobile', label: 'Mobile', icon: 'call-outline' },
    { key: 'date', label: 'Date', icon: 'calendar-outline' },
    { key: 'select', label: 'Select', icon: 'list-outline' },
    { key: 'radio', label: 'Radio', icon: 'radio-button-on-outline' },
    { key: 'checkbox', label: 'Checkbox', icon: 'checkbox-outline' },
    { key: 'upload', label: 'Upload', icon: 'cloud-upload-outline' },
];
const STARTER_SCHEMAS = [
    { id: 'kyc_individual', title: 'KYC – Individual', fields: 6 },
    { id: 'kyc_commercial', title: 'KYC – Commercial', fields: 9 },
    { id: 'vendor_onboarding', title: 'Vendor onboarding', fields: 12 },
    { id: 'inquiry_default', title: 'Inquiry form', fields: 5 },
];
export default function FormBuilderScreen() {
    const [tab, setTab] = useState('list');
    const [title, setTitle] = useState('New form');
    const [fields, setFields] = useState([
        { field: 'name', label: 'Full name', type: 'text', required: true },
        { field: 'mobile', label: 'Mobile', type: 'mobile', required: true },
    ]);
    const [preview, setPreview] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newType, setNewType] = useState('text');
    const addField = () => {
        if (!newLabel.trim())
            return Alert.alert('Field label required');
        const key = newLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const f = { field: key, label: newLabel.trim(), type: newType };
        if (newType === 'select' || newType === 'radio' || newType === 'checkbox') {
            f.options = [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }];
        }
        setFields((p) => [...p, f]);
        setNewLabel('');
    };
    const removeField = (key) => setFields((p) => p.filter((x) => x.field !== key));
    const move = (key, dir) => setFields((p) => {
        const i = p.findIndex((x) => x.field === key);
        if (i < 0)
            return p;
        const j = i + dir;
        if (j < 0 || j >= p.length)
            return p;
        const copy = [...p];
        [copy[i], copy[j]] = [copy[j], copy[i]];
        return copy;
    });
    const schema = { id: 'draft', title, fields };
    return (<Screen>
      <ScreenHeader title="Forms engine" subtitle="Design dynamic forms" showBack/>
      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('list')} style={[styles.tab, tab === 'list' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'list' && styles.tabTextActive]}>Templates</Text>
        </Pressable>
        <Pressable onPress={() => setTab('builder')} style={[styles.tab, tab === 'builder' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'builder' && styles.tabTextActive]}>Builder</Text>
        </Pressable>
      </View>

      {tab === 'list' ? (<FlatList data={STARTER_SCHEMAS} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} renderItem={({ item }) => (<Card style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.icon}><Ionicons name="document-text-outline" size={20} color={colors.primary}/></View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={typography.bodyBold}>{item.title}</Text>
                <Text style={{ ...typography.small, color: colors.textMuted }}>{item.fields} fields</Text>
              </View>
              <Button title="Edit" size="sm" variant="outline" onPress={() => setTab('builder')}/>
            </Card>)}/>) : preview ? (<View style={{ flex: 1, padding: spacing.lg }}>
          <Button title="Back to builder" variant="ghost" onPress={() => setPreview(false)}/>
          <Text style={[typography.h3, { marginVertical: spacing.sm }]}>{title}</Text>
          <FormRenderer schema={schema} onSubmit={(v) => Alert.alert('Preview submit', JSON.stringify(v, null, 2))}/>
        </View>) : (<FlatList data={fields} keyExtractor={(i) => i.field} ListHeaderComponent={<View>
              <Input label="Form title" value={title} onChangeText={setTitle}/>
              <Card style={{ marginBottom: spacing.md }}>
                <Text style={typography.bodyBold}>Add field</Text>
                <Input placeholder="Field label" value={newLabel} onChangeText={setNewLabel} style={{ marginTop: spacing.sm }}/>
                <View style={styles.typeGrid}>
                  {TYPE_OPTIONS.map((t) => {
                    const sel = newType === t.key;
                    return (<Pressable key={t.key} onPress={() => setNewType(t.key)} style={[styles.typePill, sel && styles.typePillActive]}>
                        <Ionicons name={t.icon} size={14} color={sel ? colors.textInverse : colors.text}/>
                        <Text style={[styles.typeText, sel && { color: colors.textInverse }]}>{t.label}</Text>
                      </Pressable>);
                })}
                </View>
                <Button title="Add field" onPress={addField} style={{ marginTop: spacing.sm }}/>
              </Card>
              <Text style={{ ...typography.label, color: colors.text, marginBottom: spacing.sm }}>Fields ({fields.length})</Text>
            </View>} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} renderItem={({ item, index }) => (<Card style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{item.label}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: 4 }}>
                  <Badge label={item.type} tone="info"/>
                  {item.required && <Badge label="required" tone="warning"/>}
                </View>
              </View>
              <Pressable onPress={() => move(item.field, -1)} disabled={index === 0} hitSlop={8}>
                <Ionicons name="arrow-up-outline" size={18} color={index === 0 ? colors.border : colors.text}/>
              </Pressable>
              <Pressable onPress={() => move(item.field, 1)} disabled={index === fields.length - 1} hitSlop={8} style={{ marginLeft: spacing.sm }}>
                <Ionicons name="arrow-down-outline" size={18} color={index === fields.length - 1 ? colors.border : colors.text}/>
              </Pressable>
              <Pressable onPress={() => removeField(item.field)} hitSlop={8} style={{ marginLeft: spacing.sm }}>
                <Ionicons name="trash-outline" size={18} color={colors.danger}/>
              </Pressable>
            </Card>)} ListFooterComponent={<View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <Button title="Preview" variant="outline" onPress={() => setPreview(true)} style={{ flex: 1 }}/>
              <Button title="Publish" onPress={() => Alert.alert('Published', `${title} is now live.`)} style={{ flex: 1 }}/>
            </View>}/>)}
    </Screen>);
}
const styles = StyleSheet.create({
    tabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
    tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { ...typography.small, color: colors.text, fontWeight: '600' },
    tabTextActive: { color: colors.textInverse },
    icon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
    typePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    typePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeText: { ...typography.small, color: colors.text, fontWeight: '600' },
});
