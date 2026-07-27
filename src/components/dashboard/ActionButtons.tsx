import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Plus, ArrowDown, History, RefreshCw } from "lucide-react-native";
import { colors, fonts, borderRadius } from "../../constants/theme";

interface ActionButtonsProps {
  onBuy: () => void;
  onSell: () => void;
  onHistory: () => void;
  onRefresh: () => void;
}

export const ActionButtons = React.memo(({
  onBuy,
  onSell,
  onHistory,
  onRefresh,
}: ActionButtonsProps) => {
  return (
    <View style={styles.actionsRow}>
      <ActionBtn
        icon={<Plus size={20} color={colors.textInverse} strokeWidth={2.4} />}
        label="Buy"
        onPress={onBuy}
        primary
      />
      <ActionBtn
        icon={<ArrowDown size={20} color={colors.danger} strokeWidth={2.2} />}
        label="Sell"
        onPress={onSell}
      />
      <ActionBtn
        icon={<History size={20} color={colors.icon} />}
        label="History"
        onPress={onHistory}
      />
      <ActionBtn
        icon={<RefreshCw size={20} color={colors.icon} />}
        label="Refresh"
        onPress={onRefresh}
      />
    </View>
  );
});

function ActionBtn({
  icon,
  label,
  onPress,
  primary = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.actionBtn}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[styles.actionIconCircle, primary && styles.actionIconPrimary]}
      >
        {icon}
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  actionIconCircle: {
    width: "100%",
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardHover,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  actionIconPrimary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textSecondary,
  },
});
