import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button, Input } from '@/components';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { isStrongPassword } from '@/utils/validators';
import { useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
export default function CreatePasswordScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const challengeId = route.params?.challengeId;
    const completeRegistration = useAuthStore((s) => s.completeRegistration);
    const [p1, setP1] = useState('');
    const [p2, setP2] = useState('');
    const [err, setErr] = useState();
    const [loading, setLoading] = useState(false);
    const submit = async () => {
        setErr(undefined);
        if (!isStrongPassword(p1))
            return setErr('Password needs 8+ chars, uppercase & digit');
        if (p1 !== p2)
            return setErr('Passwords do not match');
        if (!challengeId)
            return setErr('Registration verification has expired. Please register again.');
        setLoading(true);
        try {
            await completeRegistration(challengeId, p1);
            Alert.alert('Registration complete', 'Please sign in with your new password.', [
                { text: 'OK', onPress: () => nav.popToTop() },
            ]);
        }
        catch (e) {
            setErr(e?.message ?? 'Could not set the password');
        }
        finally {
            setLoading(false);
        }
    };
    return (<View style={styles.wrap}>
      <Pressable onPress={() => nav.goBack()} style={{ marginBottom: spacing.lg }}>
        <Ionicons name="chevron-back" size={26} color={colors.text}/>
      </Pressable>
      <Text style={styles.title}>Create new password</Text>
      <Text style={styles.subtitle}>Choose something secure that you{'\u2019'}ll remember.</Text>
      <Input label="New password" secureTextEntry value={p1} onChangeText={setP1}/>
      <Input label="Confirm password" secureTextEntry value={p2} onChangeText={setP2}/>
      {err ? <Text style={{ color: colors.danger, marginBottom: spacing.sm }}>{err}</Text> : null}
      <Button title="Complete registration" onPress={submit} loading={loading} fullWidth/>
    </View>);
}
const styles = StyleSheet.create({
    wrap: { flex: 1, padding: spacing.xl, paddingTop: spacing.xxxl + spacing.lg, backgroundColor: colors.bg },
    title: { ...typography.h1, color: colors.text },
    subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xl },
});
