import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, Image, StatusBar, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/colors";
import { APP_NAME, APP_TAGLINE } from "@/constants/config";
import { Routes } from "@/constants/routes";

const MIN_DISPLAY_MS = 2000;
const EASE_OUT = Easing.out(Easing.cubic);

export default function SplashScreen() {
  const nav = useNavigation();

  const bgOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(10)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.timing(bgOpacity, { toValue: 1, duration: 400, easing: EASE_OUT, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, easing: EASE_OUT, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 700, easing: EASE_OUT, useNativeDriver: true }),
      ]),
      Animated.timing(titleOpacity, { toValue: 1, duration: 450, easing: EASE_OUT, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 450, easing: EASE_OUT, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 450, easing: EASE_OUT, useNativeDriver: true }),
      ]),
      Animated.timing(loaderOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]);
    sequence.start();

    // Wait for the minimum display time, then fade out and navigate once.
    let navigated = false;
    const timer = setTimeout(() => {
      Animated.timing(exitOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        if (!navigated) {
          navigated = true;
          nav.replace(Routes.Onboarding);
        }
      });
    }, MIN_DISPLAY_MS);

    return () => {
      sequence.stop();
      clearTimeout(timer);
    };
  }, [nav, bgOpacity, logoOpacity, logoScale, titleOpacity, taglineOpacity, taglineY, loaderOpacity, exitOpacity]);

  return (
    <Animated.View style={[styles.root, { opacity: exitOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgOpacity }]}>
        <LinearGradient
          colors={[colors.primary, "#1E1B4B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <View style={styles.center}>
        <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Image
            source={require("@/assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>

        <Animated.Text style={[styles.name, { opacity: titleOpacity }]} numberOfLines={2}>
          {APP_NAME}
        </Animated.Text>

        <Animated.Text
          style={[styles.tagline, { opacity: taglineOpacity, transform: [{ translateY: taglineY }] }]}
          numberOfLines={2}
        >
          {APP_TAGLINE}
        </Animated.Text>
      </View>

      <Animated.View style={[styles.footer, { opacity: loaderOpacity }]}>
        <ActivityIndicator size="small" color="rgba(255,255,255,0.75)" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  logoWrap: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    marginBottom: 24,
  },
  logo: {
    width: 72,
    height: 72,
  },
  name: {
    color: colors.textInverse,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  tagline: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 56,
    alignSelf: "center",
  },
});