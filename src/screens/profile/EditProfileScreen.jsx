import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Input, Button, Avatar } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { spacing, typography } from '@/constants/sizes';
import { colors } from '@/constants/colors';
export default function EditProfileScreen() {
    const nav = useNavigation();
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [mobile, setMobile] = useState(user?.mobile ?? '');
    const [city, setCity] = useState(user?.city ?? '');
    const [state, setState] = useState(user?.state ?? '');
    const save = () => {
        if (user)
            setUser({ ...user, name, email, mobile, city, state });
        Alert.alert('Saved', 'Profile updated.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    };
    return (<Screen>
      <ScreenHeader title="Edit profile" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <Avatar name={name || 'U'} size={92}/>
          <Text style={{ ...typography.label, color: colors.primary, marginTop: spacing.sm }}>Change photo</Text>
        </View>
        <Input label="Full name" value={name} onChangeText={setName}/>
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
        <Input label="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad"/>
        <Input label="City" value={city} onChangeText={setCity}/>
        <Input label="State" value={state} onChangeText={setState}/>
        <Button title="Save changes" onPress={save} fullWidth/>
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({});
