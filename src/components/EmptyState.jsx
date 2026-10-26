import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';
export default function EmptyState({ icon = 'document-text-outline', title, body, action }) {
    return (<View style={styles.wrap}>
      <View style={styles.iconBubble}>
        <Ionicons name={icon} size={28} color={colors.primary}/>
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? <View style={{ marginTop: spacing.md }}>{action}</View> : null}
    </View>);
}
const styles = StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
    iconBubble: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    title: { ...typography.h3, color: colors.text, textAlign: 'center' },
    body: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
});
