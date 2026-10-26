import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen, ScreenHeader, Input, Button, Card } from '@/components';
import { mockServices } from '@/services/mockData';
import { spacing, typography } from '@/constants/sizes';
import { colors } from '@/constants/colors';
import { useLeadsStore } from '@/store/leadsStore';
import { useAuthStore } from '@/store/authStore';
import { isIndianMobile } from '@/utils/validators';
export default function InquiryScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const service = mockServices.find((s) => s.id === route.params?.serviceId);
    const createLead = useLeadsStore((s) => s.createLead);
    const user = useAuthStore((s) => s.user);
    const [name, setName] = useState(user?.name ?? '');
    const [mobile, setMobile] = useState(user?.mobile?.replace('+91 ', '') ?? '');
    const [budget, setBudget] = useState('');
    const [city, setCity] = useState(user?.city ?? '');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const submit = async () => {
        if (!service)
            return;
        if (name.trim().length < 2)
            return Alert.alert('Please enter your name');
        if (!isIndianMobile(mobile))
            return Alert.alert('Please enter a valid mobile');
        setLoading(true);
        await new Promise((r) => setTimeout(r, 600));
        createLead({
            id: `l-${Date.now()}`,
            buyerName: name,
            buyerMobile: `+91 ${mobile}`,
            serviceId: service.id,
            serviceName: service.name,
            message,
            budget: budget ? Number(budget) : undefined,
            city,
            status: 'new',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        setLoading(false);
        Alert.alert('Inquiry sent', 'The vendor will respond shortly.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    };
    return (<Screen>
      <ScreenHeader title="Send inquiry" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {service ? (<Card style={{ marginBottom: spacing.lg }}>
            <Text style={styles.muted}>You are inquiring about</Text>
            <Text style={styles.h3}>{service.name}</Text>
          </Card>) : null}
        <Input label="Your name" value={name} onChangeText={setName}/>
        <Input label="Mobile" keyboardType="number-pad" value={mobile} onChangeText={setMobile}/>
        <Input label="City" value={city} onChangeText={setCity}/>
        <Input label="Budget (\u20B9)" keyboardType="number-pad" value={budget} onChangeText={setBudget}/>
        <Input label="Message" placeholder="Tell the vendor about your project" value={message} onChangeText={setMessage} multiline numberOfLines={4} style={{ minHeight: 96, textAlignVertical: 'top' }}/>
        <Button title="Send inquiry" onPress={submit} loading={loading} fullWidth/>
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    muted: { ...typography.small, color: colors.textMuted },
    h3: { ...typography.h3, color: colors.text, marginTop: 4 },
});
