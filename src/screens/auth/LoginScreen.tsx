import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button, Input } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { APP_NAME } from '@/constants/config';
import { isEmail, isIndianMobile } from '@/utils/validators';

export default function LoginScreen() {
  const nav = useNavigation<any>();
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const signInWithOtp = useAuthStore((s) => s.signInWithOtp);

  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = async () => {
    setError(undefined);
    if (mode === 'password') {
      if (!isEmail(identifier)) return setError('Enter a valid email');
      if (password.length < 6) return setError('Password too short');
      setLoading(true);
      try {
        await signInWithPassword(identifier, password);
      } catch (e: any) {
        setError(e?.message ?? 'Login failed');
      } finally {
        setLoading(false);
      }
    } else {
      if (!isIndianMobile(identifier)) return setError('Enter a valid 10-digit mobile');
      setLoading(true);
      try {
        const { challengeId } = await signInWithOtp(identifier);
        nav.navigate(Routes.OTP, { challengeId, mobile: identifier });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroAccent} />
          <View style={styles.logoFrame}>
            <Image source={require('@/assets/icon.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.heroLabel}>India construction services marketplace</Text>
        </View>

        <View style={styles.formSurface}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to access your workspace.</Text>

        {/* <View style={styles.modeRow}>
          <Pressable onPress={() => setMode('password')} style={[styles.modeTab, mode === 'password' && styles.modeTabActive]}>
            <Text style={[styles.modeText, mode === 'password' && styles.modeTextActive]}>Password</Text>
          </Pressable>
          <Pressable onPress={() => setMode('otp')} style={[styles.modeTab, mode === 'otp' && styles.modeTabActive]}>
            <Text style={[styles.modeText, mode === 'otp' && styles.modeTextActive]}>OTP</Text>
          </Pressable>
        </View> */}

        {mode === 'password' ? (
          <>
            <Input
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={identifier}
              onChangeText={setIdentifier}
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
            />
            <Input
              label="Password"
              placeholder="At least 8 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
            />
            <Pressable onPress={() => nav.navigate(Routes.ForgotPassword)} style={{ alignSelf: 'flex-end', marginBottom: spacing.md }}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </>
        ) : (
          <Input
            label="Mobile number"
            placeholder="98xxxxxxxx"
            keyboardType="number-pad"
            value={identifier}
            onChangeText={setIdentifier}
            leftIcon={<Ionicons name="call-outline" size={18} color={colors.textMuted} />}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title={mode === 'otp' ? 'Send OTP' : 'Sign in'}
          onPress={submit}
          loading={loading}
          fullWidth
          icon={<Ionicons name={mode === 'otp' ? 'paper-plane-outline' : 'arrow-forward-outline'} size={18} color={colors.textInverse} />}
          style={styles.submitButton}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New to ContractIndia?</Text>
          <Pressable onPress={() => nav.navigate(Routes.Register)}>
            <Text style={[styles.link, { marginLeft: 4 }]}>Create an account</Text>
          </Pressable>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  hero: { backgroundColor: colors.primary, minHeight: 260, paddingTop: spacing.xxxl * 1.5, paddingHorizontal: spacing.xl, alignItems: 'center', overflow: 'hidden' },
  heroAccent: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 34, borderColor: colors.primaryLight, top: -110, right: -70 },
  logoFrame: { width: 82, height: 82, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logo: { width: 62, height: 62 },
  brand: { color: colors.textInverse, fontSize: 22, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.sm },
  heroLabel: { color: '#B4C5DA', fontSize: 11, fontWeight: '700', letterSpacing: 1.6 },
  formSurface: { backgroundColor: colors.surface, marginHorizontal: spacing.lg, marginTop: -34, borderRadius: 18, padding: spacing.xl, shadowColor: colors.primaryDark, shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  title: { ...typography.h1, color: colors.text, fontSize: 28 },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: 6 },
  modeRow: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 4, marginTop: spacing.xl, marginBottom: spacing.lg },
  modeTab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: 8 },
  modeTabActive: { backgroundColor: colors.surface },
  modeText: { ...typography.label, color: colors.textMuted },
  modeTextActive: { color: colors.primary },
  link: { ...typography.label, color: colors.primary },
  error: { ...typography.small, color: colors.danger, marginBottom: spacing.sm },
  submitButton: { minHeight: 52, borderRadius: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl },
  footerText: { ...typography.body, color: colors.textMuted },
});
