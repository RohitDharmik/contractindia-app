import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
export default function Avatar({ uri, name = '?', size = 40 }) {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        ?.toUpperCase();
    if (uri) {
        return <Image source={{ uri }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]}/>;
    }
    return (<View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: colors.textInverse, fontWeight: '700', fontSize: size / 2.6 }}>{initials}</Text>
    </View>);
}
const styles = StyleSheet.create({
    img: { backgroundColor: colors.surfaceAlt },
    fallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
