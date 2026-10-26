import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button, Input } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { isEmail, isIndianMobile } from '@/utils/validators';
export default function RegisterScreen() {
    const nav = useNavigation();
    const register = useAuthStore((s) => s.register);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [role, setRole] = useState('individual');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState();
    const submit = async () => {
        setError(undefined);
        if (name.trim().length < 2)
            return setError('Enter your name');
        if (!isEmail(email))
            return setError('Enter a valid email');
        if (!isIndianMobile(mobile))
            return setError('Enter a valid mobile');
        setLoading(true);
        try {
            const { id } = await register({ name: name.trim(), email: email.trim(), mobile: mobile.trim(), userType: role === 'commercial' ? '2' : '1' });
            nav.navigate(Routes.OTP, { challengeId: id, email: email.trim(), mobile: mobile.trim(), flow: 'registration-email' });
        }
        catch (e) {
            setError(e?.message ?? 'Sign up failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => nav.goBack()} style={{ marginBottom: spacing.lg }}>
          <Ionicons name="chevron-back" size={26} color={colors.text}/>
        </Pressable>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join 30,000+ users and vendors across India.</Text>

        <Text style={styles.label}>I am a</Text>
        <View style={styles.roleRow}>
          <RoleTile active={role === 'individual'} onPress={() => setRole('individual')} icon="home-outline" label="Individual" body="Landowner, builder, buyer"/>
          <RoleTile active={role === 'commercial'} onPress={() => setRole('commercial')} icon="business-outline" label="Commercial" body="Vendor, contractor, supplier"/>
        </View>

        <Input label="Full name" placeholder="Anjali Rao" value={name} onChangeText={setName}/>
        <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
        <Input label="Mobile" placeholder="98xxxxxxxx" keyboardType="number-pad" value={mobile} onChangeText={setMobile}/>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Create account" onPress={submit} loading={loading} fullWidth/>

        <Text style={styles.terms}>By signing up you agree to our Terms and Privacy Policy.</Text>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => nav.navigate(Routes.Login)}>
            <Text style={[styles.link, { marginLeft: 4 }]}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>);
}
function RoleTile({ active, onPress, icon, label, body }) {
    return (<Pressable onPress={onPress} style={[styles.roleTile, active && styles.roleTileActive]}>
      <Ionicons name={icon} size={22} color={active ? colors.primary : colors.textMuted}/>
      <Text style={[styles.roleLabel, active && { color: colors.primary }]}>{label}</Text>
      <Text style={styles.roleBody}>{body}</Text>
    </Pressable>);
}
const styles = StyleSheet.create({
    scroll: { padding: spacing.xl, paddingTop: spacing.xxxl + spacing.lg },
    title: { ...typography.h1, color: colors.text },
    subtitle: { ...typography.body, color: colors.textMuted, marginTop: 6, marginBottom: spacing.xl },
    label: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
    roleRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    roleTile: { flex: 1, padding: spacing.md, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    roleTileActive: { borderColor: colors.primary, backgroundColor: '#EEF3FA' },
    roleLabel: { ...typography.label, color: colors.text, marginTop: spacing.xs },
    roleBody: { ...typography.small, color: colors.textMuted, marginTop: 2 },
    error: { ...typography.small, color: colors.danger, marginBottom: spacing.sm },
    terms: { ...typography.small, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
    footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl },
    footerText: { ...typography.body, color: colors.textMuted },
    link: { ...typography.label, color: colors.primary },
});
