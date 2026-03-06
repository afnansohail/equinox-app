import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/theme";
import { formatPKR } from "../../utils/format";

interface DividendSummaryCardProps {
  totalAmount: number;
  highestScoreSymbol: string | null;
  topPayer: string | null;
}

export default function DividendSummaryCard({
  totalAmount,
  highestScoreSymbol,
  topPayer,
}: DividendSummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.mainStat}>
        <Text style={styles.label}>Total Earned</Text>
        <Text style={styles.totalValue}>
          PKR{" "}
          {formatPKR(totalAmount, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.secondaryStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue} numberOfLines={1}>
            {highestScoreSymbol ?? "—"}
          </Text>
          <Text style={styles.statLabel}>Highest Score</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue} numberOfLines={1}>
            {topPayer ?? "—"}
          </Text>
          <Text style={styles.statLabel}>Highest Payout</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  mainStat: {
    alignItems: "center",
    paddingBottom: 16,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.secondary,
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  secondaryStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});
