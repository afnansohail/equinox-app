import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fonts } from "../constants/theme";
import { useAuthStore } from "../stores/authStore";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const { signUpWithEmail } = useAuthStore();

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert("Weak Password", passwordError);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await signUpWithEmail(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert("Sign Up Failed", error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#0D0D0D", "#050505"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Content */}
            <View style={styles.content}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>Create account</Text>
                <Text style={styles.subtitle}>
                  Start tracking your PSX portfolio
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      emailFocused && styles.inputWrapperFocused,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={emailFocused ? colors.primary : colors.icon}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      passwordFocused && styles.inputWrapperFocused,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={passwordFocused ? colors.primary : colors.icon}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={colors.icon}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      confirmFocused && styles.inputWrapperFocused,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={confirmFocused ? colors.primary : colors.icon}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Repeat password"
                      placeholderTextColor={colors.textMuted}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setConfirmFocused(true)}
                      onBlur={() => setConfirmFocused(false)}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color={colors.icon}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Sign Up Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.signUpButton,
                  pressed && styles.buttonPressed,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#29FFE8", "#06B6D4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={styles.signUpButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Terms */}
              <Text style={styles.termsText}>
                By signing up, you agree to our Terms of Service and Privacy
                Policy
              </Text>

              {/* Sign In Link */}
              <View style={styles.signInSection}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <Pressable onPress={() => navigation.replace("SignIn")}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  titleSection: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontFamily: fonts.serif.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.sans.semibold,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.lg,
    fontSize: 16,
    fontFamily: fonts.sans.regular,
    color: colors.textPrimary,
  },
  eyeButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
  },
  signUpButton: {
    borderRadius: borderRadius.md,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  buttonGradient: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  signUpButtonText: {
    fontSize: 16,
    fontFamily: fonts.sans.bold,
    color: colors.textInverse,
    letterSpacing: 0.3,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  termsText: {
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  signInSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
  },
  signInLink: {
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
    color: colors.primary,
  },
});
