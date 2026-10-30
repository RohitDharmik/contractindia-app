import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/sizes';
import { useAuthStore } from '@/store/authStore';
import { Routes } from '../../constants/routes';

const LEN = 6;

export default function OTPScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const { challengeId, mobile, email, remark, flow = 'login-mobile' } = route.params ?? {};

  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const resendOtp = useAuthStore((s) => s.resendOtp);
  const verifyRegistrationEmail = useAuthStore((s) => s.verifyRegistrationEmail);
  const verifyRegistrationMobile = useAuthStore((s) => s.verifyRegistrationMobile);
  const resendRegistrationOtp = useAuthStore((s) => s.resendRegistrationOtp);

  const [digits, setDigits] = useState(Array(LEN).fill(''));
  const [seconds, setSeconds] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const refs = useRef([]);

  useEffect(() => {
    if (typeof remark === 'string' && remark.trim()) {
      Alert.alert('Message', remark.trim());
    }
  }, [remark]);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  // Supports typing one digit or pasting a complete OTP into any box.
  const onChange = (index, value) => {
    const pastedDigits = value.replace(/\D/g, '');

    if (pastedDigits.length > 1) {
      const otp = pastedDigits.slice(0, LEN).split('');
      const next = Array(LEN).fill('');
      otp.forEach((digit, digitIndex) => {
        next[digitIndex] = digit;
      });
      setDigits(next);
      setError('');
      refs.current[Math.min(otp.length, LEN) - 1]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = pastedDigits.slice(0, 1);
    setDigits(next);
    setError('');
    if (pastedDigits && index < LEN - 1) refs.current[index + 1]?.focus();
  };

  // Backspace clears the current digit; if empty, it clears the previous digit too.
  const onKeyPress = (index, event) => {
    if (event.nativeEvent.key !== 'Backspace') return;
    const next = [...digits];

    if (digits[index]) {
      next[index] = '';
      setDigits(next);
    } else if (index > 0) {
      next[index - 1] = '';
      setDigits(next);
      refs.current[index - 1]?.focus();
    }
    setError('');
  };

  const submit = async () => {
    const code = digits.join('');
    if (code.length !== LEN) {
      setError('Enter the 6-digit code');
      return;
    }
    if (!challengeId) {
      setError('Your verification session has expired. Please sign in again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (flow === 'registration-email') {
        await verifyRegistrationEmail(challengeId, code);
        nav.replace(Routes.OTP, { challengeId, mobile, flow: 'registration-mobile' });
      } else if (flow === 'registration-mobile') {
        await verifyRegistrationMobile(challengeId, code);
        nav.replace(Routes.CreatePassword, { challengeId });
      } else {
        await verifyOtp(challengeId, code);
      }
    } catch (e) {
      setError(e?.message ?? 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!challengeId || seconds > 0 || resending) return;
    setError('');
    setResending(true);
    try {
      if (flow === 'registration-email') {
        await resendRegistrationOtp(challengeId, 'email');
      } else if (flow === 'registration-mobile') {
        await resendRegistrationOtp(challengeId, 'mobile');
      } else {
        await resendOtp(challengeId);
      }
      setDigits(Array(LEN).fill(''));
      setSeconds(30);
      refs.current[0]?.focus();
    } catch (e) {
      setError(e?.message ?? 'Could not resend the code');
    } finally {
      setResending(false);
    }
  };

  const title = flow === 'registration-email'
    ? 'Verify your email'
    : mobile ? 'Verify your mobile' : 'Verify your account';

  const subtitle = flow === 'registration-email'
    ? `We sent a 6-digit code to ${email || 'your email'}`
    : mobile
      ? `We sent a 6-digit code to ${mobile}`
      : `We sent a 6-digit code to ${email || 'your registered email'}`;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.row}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { refs.current[index] = ref; }}
            value={digit}
            onChangeText={(value) => onChange(index, value)}
            onKeyPress={(event) => onKeyPress(index, event)}
            keyboardType="number-pad"
            maxLength={LEN}
            selectTextOnFocus
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            accessibilityLabel={`OTP digit ${index + 1}`}
            style={[
              styles.cell,
              digit ? styles.cellFilled : null,
              error ? styles.cellError : null,
            ]}
          />
        ))}
      </View>

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button title="Verify" onPress={submit} loading={loading} fullWidth />

      <View style={styles.resend}>
        <Text style={styles.muted}>Didn{ '\\u2019' }t receive the code?</Text>
        <Pressable disabled={seconds > 0 || resending} onPress={resend} accessibilityRole="button">
          <Text style={[styles.link, (seconds > 0 || resending) && styles.disabledLink]}>
            {seconds > 0 ? ` Resend in ${seconds}s` : resending ? ' Sending...' : ' Resend now'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: colors.bg,
    paddingTop: spacing.xxxl * 2,
  },
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 0,
  },
  cellFilled: { borderColor: colors.primary },
  cellError: { borderColor: colors.danger },
  error: { color: colors.danger, marginBottom: spacing.sm },
  resend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
  },
  muted: { ...typography.body, color: colors.textMuted },
  link: { ...typography.label, color: colors.primary },
  disabledLink: { color: colors.textMuted },
});
 
