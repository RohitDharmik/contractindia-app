import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
export default function Screen({ children, padded = true }) {
    return (<SafeAreaView edges={['top']} style={styles.safe}>
      <View style={[styles.body, padded && { paddingHorizontal: 0 }]}>{children}</View>
    </SafeAreaView>);
}
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    body: { flex: 1 },
});
