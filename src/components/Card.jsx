import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, shadows, spacing } from '@/constants/sizes';
export default function Card({ style, children, ...rest }) {
    return (<View style={[styles.card, style]} {...rest}>
      {children}
    </View>);
}
const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        ...shadows.card,
    },
});
