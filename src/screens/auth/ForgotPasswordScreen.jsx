import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button, Input } from '@/components';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { isEmail, isIndianMobile } from '@/utils/validators';
export default function ForgotPasswordScreen() {
    const nav = useNavigation();
    const [via, setVia] = useState('email');
    const [value, setValue] = useState('');
    const [error, setError] = useState();
    const submit = () => {
        setError(undefined);
        if (via === 'email' && !isEmail(value))
            return setError('Enter a valid email');
        if (via === 'mobile' && !isIndianMobile(value))
            return setError('Enter a valid mobile');
        nav.navigate(Routes.ResetPassword, { via, value });
    };
    return (<View style={styles.wrap}>
      <Pressable onPress={() => nav.goBack()} style={{ marginBottom: spacing.lg }}>
        <Ionicons name="chevron-back" size={26} color={colors.text}/>
      </Pressable>
      <Text style={styles.title}>Forgot password</Text>
      <Text style={styles.subtitle}>We{'\u2019'}ll send a verification code to reset your password.</Text>

      <View style={styles.row}>
        <Pressable onPress={() => setVia('email')} style={[styles.tab, via === 'email' && styles.tabActive]}>
          <Text style={[styles.tabText, via === 'email' && styles.tabTextActive]}>Email</Text>
        </Pressable>
        <Pressable onPress={() => setVia('mobile')} style={[styles.tab, via === 'mobile' && styles.tabActive]}>
          <Text style={[styles.tabText, via === 'mobile' && styles.tabTextActive]}>Mobile</Text>
        </Pressable>
      </View>

      <Input label={via === 'email' ? 'Email' : 'Mobile'} placeholder={via === 'email' ? 'you@example.com' : '98xxxxxxxx'} keyboardType={via === 'email' ? 'email-address' : 'number-pad'} autoCapitalize="none" value={value} onChangeText={setValue}/>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Password reset requires backend support" onPress={() => setError('Password-reset and OTP endpoints are not documented. Contact support to reset this account.')} fullWidth/>
    </View>);
}
const styles = StyleSheet.create({
    wrap: { flex: 1, padding: spacing.xl, paddingTop: spacing.xxxl + spacing.lg, backgroundColor: colors.bg },
    title: { ...typography.h1, color: colors.text },
    subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xl },
    row: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 4, marginBottom: spacing.lg },
    tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: 8 },
    tabActive: { backgroundColor: colors.surface },
    tabText: { ...typography.label, color: colors.textMuted },
    tabTextActive: { color: colors.primary },
    error: { color: colors.danger, marginBottom: spacing.sm },
});
