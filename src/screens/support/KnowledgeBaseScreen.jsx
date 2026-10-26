import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Card } from '@/components';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
const articles = [
    { id: 'a1', title: 'Getting started as a buyer', body: 'Learn how to browse, save and contact vendors.' },
    { id: 'a2', title: 'How vendors get verified', body: 'KYC, GST/CIN review, document checks.' },
    { id: 'a3', title: 'Understanding credits & subscriptions', body: 'Pricing model, refunds, expiry.' },
    { id: 'a4', title: 'Best practices for great listings', body: 'Photos, copy, pricing tips that convert.' },
    { id: 'a5', title: 'Resolving disputes', body: 'Escalation paths, mediation, and refunds.' },
];
export default function KnowledgeBaseScreen() {
    return (<Screen>
      <ScreenHeader title="Knowledge base" showBack/>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {articles.map((a) => (<Pressable key={a.id}>
            <Card style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={22} color={colors.primary}/>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={typography.bodyBold}>{a.title}</Text>
                <Text style={{ ...typography.small, color: colors.textMuted, marginTop: 2 }}>{a.body}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted}/>
            </Card>
          </Pressable>))}
      </ScrollView>
    </Screen>);
}
