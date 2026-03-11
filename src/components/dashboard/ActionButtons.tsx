import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ArrowUpRight, ArrowDownRight, History, RefreshCw } from "lucide-react-native";
import { colors } from "../../constants/theme";

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
        icon={<ArrowUpRight size={22} color={colors.success} />}
        label="Buy"
        onPress={onBuy}
      />
      <ActionBtn
        icon={<ArrowDownRight size={22} color={colors.danger} />}
        label="Sell"
        onPress={onSell}
      />
      <ActionBtn
        icon={<History size={22} color={colors.icon} />}
        label="History"
        onPress={onHistory}
      />
      <ActionBtn
        icon={<RefreshCw size={22} color={colors.icon} />}
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
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionBtn}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.actionIconCircle}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
