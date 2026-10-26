import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button, Input } from '@/components';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
import { Routes } from '@/constants/routes';
export default function ResetPasswordScreen() {
    const nav = useNavigation();
    const [code, setCode] = useState('');
    return (<View style={styles.wrap}>
      <Pressable onPress={() => nav.goBack()} style={{ marginBottom: spacing.lg }}>
        <Ionicons name="chevron-back" size={26} color={colors.text}/>
      </Pressable>
      <Text style={styles.title}>Enter reset code</Text>
      <Text style={styles.subtitle}>Check your email/SMS for the 6-digit code.</Text>
      <Input label="Reset code" placeholder="6-digit code" keyboardType="number-pad" value={code} onChangeText={setCode} maxLength={6}/>
      <Button title="Unavailable until reset API is confirmed" onPress={() => {}} fullWidth/>
    </View>);
}
const styles = StyleSheet.create({
    wrap: { flex: 1, padding: spacing.xl, paddingTop: spacing.xxxl + spacing.lg, backgroundColor: colors.bg },
    title: { ...typography.h1, color: colors.text },
    subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xl },
});
