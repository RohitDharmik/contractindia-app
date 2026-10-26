import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { useAuthStore } from '@/store/authStore';
const LEN = 6;
export default function OTPScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const { challengeId, mobile, email, activationCode, flow = 'login-mobile' } = route.params ?? {};
    const verifyOtp = useAuthStore((s) => s.verifyOtp);
    const resendOtp = useAuthStore((s) => s.resendOtp);
    const verifyRegistrationEmail = useAuthStore((s) => s.verifyRegistrationEmail);
    const verifyRegistrationMobile = useAuthStore((s) => s.verifyRegistrationMobile);
    const resendRegistrationOtp = useAuthStore((s) => s.resendRegistrationOtp);
    const [digits, setDigits] = useState(Array(LEN).fill(''));
    const [seconds, setSeconds] = useState(30);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState();
    const refs = useRef([]);
    useEffect(() => {
        if (seconds <= 0)
            return;
        const t = setInterval(() => setSeconds((s) => s - 1), 1000);
        return () => clearInterval(t);
    }, [seconds]);
    const onChange = (i, v) => {
        const ch = v.replace(/\D/g, '').slice(0, 1);
        const next = [...digits];
        next[i] = ch;
        setDigits(next);
        if (ch && i < LEN - 1)
            refs.current[i + 1]?.focus();
    };
    const submit = async () => {
        const code = digits.join('');
        if (code.length !== LEN)
            return setError('Enter the 6-digit code');
        if (!challengeId)
            return setError('Your login verification has expired. Please sign in again.');
        setLoading(true);
        setError(undefined);
        try {
            if (flow === 'registration-email') {
                await verifyRegistrationEmail(challengeId, code);
                nav.replace(Routes.OTP, { challengeId, mobile, flow: 'registration-mobile' });
            }
            else if (flow === 'registration-mobile') {
                await verifyRegistrationMobile(challengeId, code);
                nav.replace(Routes.CreatePassword, { challengeId });
            }
            else {
                await verifyOtp(challengeId, code);
            }
        }
        catch (e) {
            setError(e?.message ?? 'Invalid code');
        }
        finally {
            setLoading(false);
        }
    };
    const resend = async () => {
        if (!challengeId || seconds > 0 || resending)
            return;
        setError(undefined);
        setResending(true);
        try {
            if (flow === 'registration-email') await resendRegistrationOtp(challengeId, 'email');
            else if (flow === 'registration-mobile') await resendRegistrationOtp(challengeId, 'mobile');
            else await resendOtp(challengeId);
            setSeconds(30);
        }
        catch (e) {
            setError(e?.message ?? 'Could not resend the code');
        }
        finally {
            setResending(false);
        }
    };
    return (<View style={styles.wrap}>
      <Text style={styles.title}>{flow === 'registration-email' ? 'Verify your email' : mobile ? 'Verify your mobile' : 'Verify your account'}</Text>
      <Text style={styles.subtitle}>{flow === 'registration-email' ? `We sent a 6-digit code to ${email || 'your email'}` : mobile ? `We sent a 6-digit code to ${mobile}` : `We sent a 6-digit code to ${email || 'your registered email'}`}</Text>

      <View style={styles.row}>
        {digits.map((d, i) => (<TextInput key={i} ref={(r) => { refs.current[i] = r; }} value={d} onChangeText={(v) => onChange(i, v)} keyboardType="number-pad" maxLength={1} style={styles.cell}/>))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Verify" onPress={submit} loading={loading} fullWidth/>

      <View style={styles.resend}>
        <Text style={styles.muted}>Didn{'\u2019'}t receive the code?</Text>
                <Pressable disabled={seconds > 0 || resending} onPress={resend}>
                    <Text style={[styles.link, (seconds > 0 || resending) && { color: colors.textMuted }]}>
                        {seconds > 0 ? ` Resend in ${seconds}s` : resending ? ' Sending...' : ' Resend now'}
                    </Text>
                </Pressable>
      </View>
    </View>);
}
const styles = StyleSheet.create({
    wrap: { flex: 1, padding: spacing.xl, backgroundColor: colors.bg, paddingTop: spacing.xxxl * 2 },
    title: { ...typography.h1, color: colors.text },
    subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xxl },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
    cell: { width: 48, height: 56, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.text },
    error: { color: colors.danger, marginBottom: spacing.sm },
    resend: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
    muted: { ...typography.body, color: colors.textMuted },
    link: { ...typography.label, color: colors.primary },
});
