import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { TrendingUp } from "lucide-react-native";
import { colors } from "../constants/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const { height } = Dimensions.get("window");

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Subtle gradient background */}
      <LinearGradient
        colors={["#0C0C0E", "#0F0F14"]}
        style={StyleSheet.absoluteFill}
      />
      {/* Ambient teal glow at top */}
      <View style={styles.glowTop} />

      <SafeAreaView style={styles.safeArea}>
        {/* Branding */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <TrendingUp size={36} color={colors.textInverse} />
          </View>
          <Text style={styles.appName}>Equinox</Text>
          <Text style={styles.tagline}>Track your PSX portfolio</Text>
        </View>

        {/* Feature list */}
        <View style={styles.features}>
          <FeatureRow emoji="📈" text="Real-time PSX stock data" />
          <FeatureRow emoji="✅" text="Shariah compliance screening" />
          <FeatureRow emoji="🔒" text="Your data, fully private" />
        </View>

        {/* Auth Buttons */}
        <View style={styles.authSection}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("SignUp")}
          >
            <Text style={styles.primaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("SignIn")}
          >
            <Text style={styles.secondaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("ContinueAsGuest")}
          >
            <Text style={styles.guestBtnText}>Continue as Guest →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FeatureRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  glowTop: {
    position: "absolute",
    top: -80,
    left: "25%",
    width: "50%",
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(41, 253, 230, 0.08)",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
    paddingTop: height * 0.08,
    paddingBottom: 32,
  },
  brand: { alignItems: "center", gap: 12 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  features: { gap: 16 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  featureEmoji: { fontSize: 20 },
  featureText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  authSection: { gap: 12 },
  primaryBtn: {
    height: 54,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textInverse,
  },
  secondaryBtn: {
    height: 54,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  guestBtn: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  guestBtnText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
