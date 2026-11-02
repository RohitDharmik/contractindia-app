
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  BackHandler,
} from "react-native";

import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import RootNavigator from "./src/navigation/RootNavigator";
import { navigationTheme } from "./src/theme";

// App expiry: 20 November 2026 (inclusive)
const EXPIRY_DATE = new Date(2026, 10, 21, 0, 0, 0);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const isAppExpired = () => {
  return new Date() >= EXPIRY_DATE;
};

function AppExpiredScreen() {
  return (
    <View style={styles.overlay}>
      <View style={styles.popup}>
        <Text style={styles.lockIcon}>🔒</Text>

        <Text style={styles.title}>
          Application Access Expired
        </Text>

        <Text style={styles.message}>
          Access to this application is currently unavailable.
        </Text>

        <Text style={styles.description}>
          The application access validity period has ended.
          Please contact the concerned team to continue using
          the application.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.contactTitle}>
          Contact Support Team
        </Text>

        <Text style={styles.footer}>
          Please contact your administrator for further assistance.
        </Text>
      </View>
    </View>
  );
}

export default function App() {
  const [expired, setExpired] = useState(isAppExpired);

  useEffect(() => {
    const checkExpiry = () => {
      setExpired(isAppExpired());
    };

    // Check expiry periodically
    const interval = setInterval(checkExpiry, 30000);

    // Prevent Android back button from bypassing the restriction
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isAppExpired()) {
          setExpired(true);
          return true;
        }
        return false;
      }
    );

    return () => {
      clearInterval(interval);
      backHandler.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar
            style="light"
            backgroundColor={expired ? "#111827" : undefined}
          />

          {expired ? (
            <AppExpiredScreen />
          ) : (
            <NavigationContainer theme={navigationTheme}>
              <RootNavigator />
            </NavigationContainer>
          )}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  popup: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    elevation: 15,
  },
  lockIcon: {
    fontSize: 55,
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 23,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 22,
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2563EB",
  },
  footer: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 19,
  },
});
