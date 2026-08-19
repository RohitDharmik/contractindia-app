import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { APP_NAME, APP_TAGLINE } from '@/constants/config';
import { Routes } from '@/constants/routes';

export default function SplashScreen() {
  const nav = useNavigation<any>();
  useEffect(() => {
    const t = setTimeout(() => nav.replace(Routes.Onboarding), 1200);
    return () => clearTimeout(t);
  }, [nav]);
  return (
    <View style={styles.wrap}>
      <Image source={require('@/assets/icon.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.name}>{APP_NAME}</Text>
      <Text style={styles.tag}>{APP_TAGLINE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 96, height: 96 },
  name: { color: colors.textInverse, fontSize: 26, fontWeight: '700', marginTop: 12 },
  tag: { color: '#B4C5DA', fontSize: 14, marginTop: 6 },
});
