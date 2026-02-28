import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fonts } from "../constants/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const { width, height } = Dimensions.get("window");

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#0D0D0D", "#050505"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative gradient orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={["rgba(41, 255, 232, 0.15)", "transparent"]}
          style={[styles.orb, styles.orbTop]}
        />
        <LinearGradient
          colors={["rgba(139, 92, 246, 0.1)", "transparent"]}
          style={[styles.orb, styles.orbBottom]}
        />
      </View>

      <SafeAreaView style={styles.content}>
        {/* Logo & Branding */}
        <View style={styles.brandingSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={["#29FFE8", "#06B6D4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="trending-up" size={40} color="#000" />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>Equinox</Text>
          <Text style={styles.tagline}>
            Track your PSX portfolio with elegance
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <FeatureItem
            icon="analytics-outline"
            title="Real-time Tracking"
            description="Monitor your investments with live PSX data"
          />
          <FeatureItem
            icon="shield-checkmark-outline"
            title="Shariah Screening"
            description="Identify Shariah-compliant stocks instantly"
          />
          <FeatureItem
            icon="sync-outline"
            title="Multi-device Sync"
            description="Access your portfolio from anywhere"
          />
        </View>

        {/* Auth Buttons */}
        <View style={styles.authSection}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => navigation.navigate("SignUp")}
          >
            <LinearGradient
              colors={["#29FFE8", "#06B6D4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => navigation.navigate("SignIn")}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.guestButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => navigation.navigate("ContinueAsGuest")}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={colors.textMuted}
              style={{ marginLeft: 8 }}
            />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={24} color={colors.icon} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbTop: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    right: -width * 0.5,
  },
  orbBottom: {
    width: width,
    height: width,
    bottom: -width * 0.3,
    left: -width * 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "space-between",
    paddingBottom: spacing.xl,
  },
  brandingSection: {
    alignItems: "center",
    marginTop: height * 0.08,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 42,
    fontFamily: fonts.serif.bold,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  featuresSection: {
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
  },
  authSection: {
    gap: spacing.md,
  },
  primaryButton: {
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: fonts.sans.bold,
    color: colors.textInverse,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
  },
  guestButton: {
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  guestButtonText: {
    fontSize: 14,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
