import React, { useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useIsRestoring } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import RootNavigator from "./src/navigation/RootNavigator";
import { useAuthStore } from "./src/stores/authStore";
import { useThemeStore } from "./src/stores/themeStore";
import { colors } from "./src/constants/theme";
import { queryClient, persistOptions } from "./src/lib/queryClient";
import "./global.css";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { loading, initialize, cleanup } = useAuthStore();
  const { loadSavedTheme } = useThemeStore();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    void initialize();
    void loadSavedTheme();

    // Cleanup auth subscription on unmount
    return () => {
      cleanup();
    };
  }, [initialize, loadSavedTheme, cleanup]);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppContent />
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

function AppContent() {
  const isRestoring = useIsRestoring();

  const onLayoutRootView = useCallback(async () => {
    if (!isRestoring) {
      await SplashScreen.hideAsync();
    }
  }, [isRestoring]);

  useEffect(() => {
    if (!isRestoring) {
      void onLayoutRootView();
    }
  }, [isRestoring, onLayoutRootView]);

  return <RootNavigator />;
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
