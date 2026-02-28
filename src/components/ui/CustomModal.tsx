import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../constants/theme";

export interface ModalButton {
  text: string;
  onPress: () => void;
  style?: "default" | "cancel" | "destructive";
  loading?: boolean;
}

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  buttons?: ModalButton[];
  icon?: React.ReactNode;
}

export default function CustomModal({
  visible,
  onClose,
  title,
  message,
  buttons = [{ text: "OK", onPress: () => {}, style: "default" }],
  icon,
}: CustomModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.buttonRow}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === "destructive";
              const isCancel = btn.style === "cancel";
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isDestructive && styles.buttonDestructive,
                    isCancel && styles.buttonCancel,
                    !isDestructive && !isCancel && styles.buttonPrimary,
                  ]}
                  onPress={btn.onPress}
                  disabled={btn.loading}
                  activeOpacity={0.8}
                >
                  {btn.loading ? (
                    <ActivityIndicator
                      color={isCancel ? colors.textSecondary : "#fff"}
                      size="small"
                    />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        isDestructive && styles.buttonTextDestructive,
                        isCancel && styles.buttonTextCancel,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(41, 253, 230, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "column",
    gap: 8,
    width: "100%",
    marginTop: 8,
  },
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  buttonPrimary: {
    backgroundColor: colors.secondary,
  },
  buttonDestructive: {
    backgroundColor: colors.danger,
  },
  buttonCancel: {
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textInverse,
  },
  buttonTextDestructive: {
    color: "#fff",
  },
  buttonTextCancel: {
    color: colors.textSecondary,
  },
});
