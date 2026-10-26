import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Input, Button } from '@/components';
import { spacing } from '@/constants/sizes';
import { isStrongPassword } from '@/utils/validators';
export default function ChangePasswordScreen() {
    const nav = useNavigation();
    const [cur, setCur] = useState('');
    const [n1, setN1] = useState('');
    const [n2, setN2] = useState('');
    const submit = () => {
        if (!cur)
            return Alert.alert('Enter current password');
        if (!isStrongPassword(n1))
            return Alert.alert('Password needs 8+ chars, uppercase & digit');
        if (n1 !== n2)
            return Alert.alert('Passwords do not match');
        Alert.alert('Updated', 'Password changed successfully.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    };
    return (<Screen>
      <ScreenHeader title="Change password" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Input label="Current password" secureTextEntry value={cur} onChangeText={setCur}/>
        <Input label="New password" secureTextEntry value={n1} onChangeText={setN1} hint="At least 8 chars, includes uppercase + digit"/>
        <Input label="Confirm new password" secureTextEntry value={n2} onChangeText={setN2}/>
        <Button title="Update password" onPress={submit} fullWidth/>
      </ScrollView>
    </Screen>);
}
