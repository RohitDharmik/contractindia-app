import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
export default function FormRenderer({ schema, initial, onSubmit }) {
    const [values, setValues] = useState(initial ?? {});
    const set = (k, v) => setValues((p) => ({ ...p, [k]: v }));
    return (<View>
      {schema.fields.map((f) => (<Field key={f.field} field={f} value={values[f.field]} onChange={(v) => set(f.field, v)}/>))}
      <Button title="Submit" onPress={() => onSubmit(values)} fullWidth/>
    </View>);
}
function Field({ field, value, onChange }) {
    switch (field.type) {
        case 'text':
        case 'email':
            return <Input label={field.label} placeholder={field.placeholder} value={value ?? ''} onChangeText={onChange} keyboardType={field.type === 'email' ? 'email-address' : 'default'} autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}/>;
        case 'number':
            return <Input label={field.label} placeholder={field.placeholder} value={value ? String(value) : ''} onChangeText={(t) => onChange(t.replace(/\D/g, ''))} keyboardType="number-pad"/>;
        case 'mobile':
            return <Input label={field.label} placeholder="10-digit mobile" value={value ?? ''} onChangeText={onChange} keyboardType="number-pad" maxLength={10}/>;
        case 'date':
            return <Input label={field.label} placeholder="DD-MM-YYYY" value={value ?? ''} onChangeText={onChange}/>;
        case 'upload':
            return (<Pressable onPress={() => onChange('uploaded.pdf')} style={styles.upload}>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.primary}/>
          <Text style={{ ...typography.body, color: colors.text, marginLeft: spacing.sm }}>
            {value ? value : `Upload ${field.label}`}
          </Text>
        </Pressable>);
        case 'select':
        case 'radio':
            return (<View style={{ marginBottom: spacing.md }}>
          <Text style={styles.label}>{field.label}</Text>
          <View style={styles.opts}>
            {(field.options ?? []).map((o) => {
                    const sel = value === o.value;
                    return (<Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.opt, sel && styles.optActive]}>
                  <Text style={[styles.optText, sel && styles.optTextActive]}>{o.label}</Text>
                </Pressable>);
                })}
          </View>
        </View>);
        case 'checkbox':
            return (<View style={{ marginBottom: spacing.md }}>
          <Text style={styles.label}>{field.label}</Text>
          {(field.options ?? []).map((o) => {
                    const arr = Array.isArray(value) ? value : [];
                    const sel = arr.includes(o.value);
                    return (<Pressable key={o.value} onPress={() => onChange(sel ? arr.filter((v) => v !== o.value) : [...arr, o.value])} style={styles.checkRow}>
                <Ionicons name={sel ? 'checkbox' : 'square-outline'} size={20} color={sel ? colors.primary : colors.textMuted}/>
                <Text style={{ ...typography.body, color: colors.text, marginLeft: spacing.sm }}>{o.label}</Text>
              </Pressable>);
                })}
        </View>);
        default:
            return null;
    }
}
const styles = StyleSheet.create({
    label: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
    upload: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface },
    opts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    opt: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    optActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    optText: { ...typography.small, color: colors.text, fontWeight: '600' },
    optTextActive: { color: colors.textInverse },
    checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
});
