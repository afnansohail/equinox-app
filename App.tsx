import React, { useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import "./global.css";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function App() {
  const { loading, initialize } = useAuthStore();
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
  }, [initialize, loadSavedTheme]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && !loading) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, loading]);

  useEffect(() => {
    if (fontsLoaded && !loading) {
      void onLayoutRootView();
    }
  }, [fontsLoaded, loading, onLayoutRootView]);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
