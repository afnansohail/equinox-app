import React, { useState } from "react";
import {
  ScrollView,
  Text,
  Pressable,
  View,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  ChevronRight,
  History,
  Mail,
  LogOut,
  Shield,
  RefreshCw,
  Info,
} from "lucide-react-native";
import { useAuthStore } from "../stores/authStore";
import type { RootStackParamList } from "../navigation/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  colors,
  theme,
  spacing,
  borderRadius,
  fonts,
} from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const { user, isAnonymous, signOut, linkAnonymousToEmail } = useAuthStore();
  const navigation = useNavigation<Nav>();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [linking, setLinking] = useState(false);

  const handleLinkAccount = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLinking(true);
    const { error } = await linkAnonymousToEmail(email.trim(), password);
    setLinking(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      setShowLinkModal(false);
      Alert.alert(
        "Success",
        "Your account has been linked! You can now sign in on any device.",
      );
    }
  };

  return (
    <SafeAreaView style={theme.screen} edges={["top"]}>
      <LinearGradient
        colors={["rgba(41, 255, 232, 0.03)", "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />
      <ScrollView
        style={theme.screen}
        contentContainerStyle={[
          theme.screenPadding,
          { paddingBottom: spacing.xxl },
        ]}
      >
        <View style={theme.titleSection}>
          <Text style={theme.title}>Settings</Text>
          <Text style={theme.subtitle}>
            Manage your account and preferences
          </Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <View style={styles.accountRow}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={["#29FFE8", "#06B6D4"]}
                  style={styles.avatarGradient}
                >
                  <Ionicons
                    name="person"
                    size={24}
                    color={colors.textInverse}
                  />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountLabel}>
                  {isAnonymous ? "Guest Account" : (user?.email ?? "Signed In")}
                </Text>
                <Text style={styles.accountId}>
                  ID: {user?.id?.slice(0, 8)}...
                </Text>
              </View>
              {isAnonymous && (
                <View style={styles.guestBadge}>
                  <Text style={styles.guestBadgeText}>Guest</Text>
                </View>
              )}
            </View>

            {isAnonymous && (
              <Pressable
                style={({ pressed }) => [
                  styles.linkAccountBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => setShowLinkModal(true)}
              >
                <Mail color={colors.primary} size={18} />
                <Text style={styles.linkAccountText}>
                  Link Email to Save Your Data
                </Text>
                <ChevronRight color={colors.primary} size={18} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.card}>
            <MenuItem
              icon={<History color={colors.icon} size={20} />}
              label="Transaction History"
              onPress={() => navigation.navigate("TransactionHistory")}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <RefreshCw color={colors.icon} size={18} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.infoLabel}>Data Refresh</Text>
                <Text style={styles.infoValue}>
                  Prices update automatically every 30 minutes during trading
                  hours
                </Text>
              </View>
            </View>
            <View style={[styles.infoRow, { marginTop: spacing.md }]}>
              <Info color={colors.icon} size={18} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.infoLabel}>Equinox</Text>
                <Text style={styles.infoValue}>
                  Personal PSX portfolio tracker built with Expo & Supabase
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <Pressable
          style={({ pressed }) => [
            styles.signOutBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => {
            Alert.alert(
              "Sign Out",
              isAnonymous
                ? "Your data will be lost if you sign out of a guest account. Are you sure?"
                : "Are you sure you want to sign out?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Sign Out",
                  style: "destructive",
                  onPress: () => signOut(),
                },
              ],
            );
          }}
        >
          <LogOut color={colors.danger} size={20} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      {/* Link Account Modal */}
      <Modal
        visible={showLinkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link Your Account</Text>
            <Text style={styles.modalSubtitle}>
              Add an email and password to access your portfolio on any device
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Repeat password"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowLinkModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalLinkBtn, linking && { opacity: 0.6 }]}
                onPress={handleLinkAccount}
                disabled={linking}
              >
                {linking ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <Text style={styles.modalLinkText}>Link Account</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && { backgroundColor: colors.cardHover },
      ]}
      onPress={onPress}
    >
      {icon}
      <Text style={styles.menuItemLabel}>{label}</Text>
      <ChevronRight color={colors.icon} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  accountLabel: {
    fontSize: 16,
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
  },
  accountId: {
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  guestBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  guestBadgeText: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.primary,
  },
  linkAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryMuted,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  linkAccountText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
    color: colors.primary,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.sans.medium,
    color: colors.textPrimary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
    paddingBottom: 0,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
    lineHeight: 18,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dangerMuted,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: fonts.sans.semibold,
    color: colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.serif.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    fontFamily: fonts.sans.regular,
    color: colors.textPrimary,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalCancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: fonts.sans.semibold,
    color: colors.textSecondary,
  },
  modalLinkBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
  },
  modalLinkText: {
    fontSize: 15,
    fontFamily: fonts.sans.semibold,
    color: colors.primary,
  },
});
