import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronRight,
  History,
  Mail,
  LogOut,
  User,
  Info,
  Shield,
} from "lucide-react-native";
import { useAuthStore } from "../stores/authStore";
import type { RootStackParamList } from "../navigation/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, TAB_BAR_HEIGHT } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function SettingsRow({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowLabel, destructive && { color: colors.danger }]}>
        {label}
      </Text>
      <ChevronRight
        size={18}
        color={destructive ? colors.danger : colors.textMuted}
      />
    </TouchableOpacity>
  );
}

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
        "Account linked! You can now sign in on any device.",
      );
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const displayName = isAnonymous
    ? "Guest Account"
    : (user?.email ?? "Signed In");
  const avatarLetter = isAnonymous
    ? "G"
    : (user?.email?.[0]?.toUpperCase() ?? "U");

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: TAB_BAR_HEIGHT + 24 },
        ]}
      >
        <Text style={styles.title}>Settings</Text>

        {/* Account Card */}
        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{displayName}</Text>
            {isAnonymous ? (
              <View style={styles.guestBadge}>
                <Text style={styles.guestBadgeText}>Guest</Text>
              </View>
            ) : (
              <Text style={styles.accountId}>
                ID: {user?.id?.slice(0, 8)}...
              </Text>
            )}
          </View>
        </View>

        {/* Link Account (guests only) */}
        {isAnonymous && (
          <TouchableOpacity
            style={styles.linkBanner}
            onPress={() => setShowLinkModal(true)}
            activeOpacity={0.8}
          >
            <Mail size={18} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.linkBannerTitle}>Link Email Address</Text>
              <Text style={styles.linkBannerSub}>
                Save your data and sync across devices
              </Text>
            </View>
            <ChevronRight size={18} color={colors.secondary} />
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <SettingsRow
              icon={<History size={18} color={colors.textSecondary} />}
              label="Transaction History"
              onPress={() => navigation.navigate("TransactionHistory")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <SettingsRow
              icon={<Info size={18} color={colors.textSecondary} />}
              label="Equinox v1.0"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={<Shield size={18} color={colors.textSecondary} />}
              label="PSX data by Sarmaaya.pk"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Sign Out */}
        {!isAnonymous && (
          <View style={styles.section}>
            <View style={styles.card}>
              <SettingsRow
                icon={<LogOut size={18} color={colors.danger} />}
                label="Sign Out"
                onPress={handleSignOut}
                destructive
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Link Account Modal */}
      <Modal
        visible={showLinkModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Link Email Account</Text>
            <Text style={styles.modalSubtitle}>
              Your data is saved locally. Link an email to sync across devices.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
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
              />
            </View>

            <TouchableOpacity
              style={styles.linkBtn}
              onPress={handleLinkAccount}
              disabled={linking}
            >
              {linking ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.linkBtnText}>Link Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowLinkModal(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  // Account card
  accountCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textInverse,
  },
  accountInfo: { flex: 1, gap: 4 },
  accountName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  accountId: { fontSize: 13, color: colors.textSecondary },
  guestBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,184,0,0.15)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  guestBadgeText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: "600",
  },
  // Link Banner
  linkBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(41,253,230,0.07)",
    borderColor: "rgba(41,253,230,0.25)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  linkBannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.secondary,
  },
  linkBannerSub: { fontSize: 12, color: colors.textSecondary },
  // Sections
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingLeft: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 60 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
  input: {
    height: 48,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  linkBtn: {
    height: 50,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  linkBtnText: { fontSize: 15, fontWeight: "700", color: colors.textInverse },
  cancelBtn: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, color: colors.textSecondary },
});
