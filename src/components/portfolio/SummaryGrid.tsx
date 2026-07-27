import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../constants/theme";
import { formatPKR, formatPercentage } from "../../utils/format";

interface SummaryGridProps {
  dayPnL: number;
  dayPnLPct: number;
  dayIsPositive: boolean;
  totalPnL: number;
  totalPnLPct: number;
  isPositive: boolean;
  totalInvested: number;
  totalValue: number;
}

export const SummaryGrid = React.memo(({
  dayPnL,
  dayPnLPct,
  dayIsPositive,
  totalPnL,
  totalPnLPct,
  isPositive,
  totalInvested,
  totalValue,
}: SummaryGridProps) => {
  return (
    <View style={styles.summaryGrid}>
      <View style={styles.gridRow}>
        <View style={[styles.summaryCard, styles.plainCard]}>
          <Text style={styles.summaryLabel}>Invested</Text>
          <Text style={styles.summaryValue}>
            {formatPKR(totalInvested)}
          </Text>
        </View>

        <View style={[styles.summaryCard, styles.plainCard]}>
          <Text style={styles.summaryLabel}>Market value</Text>
          <Text style={styles.summaryValue}>{formatPKR(totalValue)}</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: dayIsPositive
                ? colors.successMuted
                : colors.dangerMuted,
              borderColor: dayIsPositive
                ? "rgba(52,211,153,0.22)"
                : "rgba(255,107,107,0.22)",
            },
          ]}
        >
          <Text style={styles.summaryLabel}>Today's P/L</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: dayIsPositive ? colors.success : colors.danger },
            ]}
          >
            {dayIsPositive ? "+" : ""}
            {formatPKR(dayPnL)}
          </Text>
          <Text
            style={[
              styles.summaryPct,
              { color: dayIsPositive ? colors.success : colors.danger },
            ]}
          >
            {formatPercentage(dayPnLPct)}
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isPositive
                ? colors.successMuted
                : colors.dangerMuted,
              borderColor: isPositive
                ? "rgba(52,211,153,0.22)"
                : "rgba(255,107,107,0.22)",
            },
          ]}
        >
          <Text style={styles.summaryLabel}>Unrealised</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: isPositive ? colors.success : colors.danger },
            ]}
          >
            {isPositive ? "+" : ""}
            {formatPKR(totalPnL)}
          </Text>
          <Text
            style={[
              styles.summaryPct,
              { color: isPositive ? colors.success : colors.danger },
            ]}
          >
            {formatPercentage(totalPnLPct)}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  summaryGrid: { gap: 12, marginBottom: 12 },
  gridRow: { flexDirection: "row", gap: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  plainCard: {
    backgroundColor: colors.accentTile,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
    letterSpacing: 0.1,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 19,
    fontFamily: fonts.sans.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.02,
  },
  summaryPct: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    opacity: 0.8,
  },
});
