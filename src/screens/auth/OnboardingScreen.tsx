import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/sizes';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: 'search-outline' as const,
    title: 'Discover trust of our services',
    body: 'Architects, contractors, suppliers and consultants \u2014 verified and rated.',
  },
  {
    icon: 'cash-outline' as const,
    title: 'Pay only when you connect',
    body: 'Browse and Spend credits to unlock contacts and premium documents.',
  },
  {
    icon: 'rocket-outline' as const,
    title: 'More business',
    body: 'Vendors get qualified leads, premium positioning, and analytics.',
  },
];

export default function OnboardingScreen() {
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);

  const next = () => {
    if (index < slides.length - 1) {
      ref.current?.scrollToIndex({ index: index + 1 });
    } else {
      completeOnboarding();
    }
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconBubble}>
              <Ionicons name={item.icon} size={42} color={colors.accent} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, index === i && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.actions}>
        <Button title="Skip" variant="ghost" onPress={() => completeOnboarding()} />
        <Button title={index === slides.length - 1 ? 'Get Started' : 'Next'} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingVertical: spacing.xxxl },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  iconBubble: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  title: { ...typography.h1, color: colors.text, textAlign: 'center' },
  body: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md, fontSize: 15, lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 22 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl },
});
