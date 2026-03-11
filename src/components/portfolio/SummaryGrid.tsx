import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import { colors } from "../../constants/theme";
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
        <View
          style={[
            styles.summaryCard,
            styles.smallCard,
            {
              borderColor: dayIsPositive
                ? "rgba(34,197,94,0.3)"
                : "rgba(239,68,68,0.3)",
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
            {dayIsPositive ? "+" : ""}PKR {formatPKR(Math.abs(dayPnL))}
          </Text>
          <View
            style={[
              styles.summaryPill,
              {
                backgroundColor: dayIsPositive
                  ? "rgba(34,197,94,0.12)"
                  : "rgba(239,68,68,0.12)",
              },
            ]}
          >
            {dayIsPositive ? (
              <TrendingUp size={11} color={colors.success} />
            ) : (
              <TrendingDown size={11} color={colors.danger} />
            )}
            <Text
              style={[
                styles.summaryPillText,
                { color: dayIsPositive ? colors.success : colors.danger },
              ]}
            >
              {formatPercentage(dayPnLPct)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.summaryCard,
            styles.smallCard,
            {
              borderColor: isPositive
                ? "rgba(34,197,94,0.3)"
                : "rgba(239,68,68,0.3)",
            },
          ]}
        >
          <Text style={styles.summaryLabel}>Unrealized P/L</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: isPositive ? colors.success : colors.danger },
            ]}
          >
            {isPositive ? "+" : ""}PKR {formatPKR(Math.abs(totalPnL))}
          </Text>
          <View
            style={[
              styles.summaryPill,
              {
                backgroundColor: isPositive
                  ? "rgba(34,197,94,0.12)"
                  : "rgba(239,68,68,0.12)",
              },
            ]}
          >
            {isPositive ? (
              <TrendingUp size={11} color={colors.success} />
            ) : (
              <TrendingDown size={11} color={colors.danger} />
            )}
            <Text
              style={[
                styles.summaryPillText,
                { color: isPositive ? colors.success : colors.danger },
              ]}
            >
              {formatPercentage(totalPnLPct)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={[styles.summaryCard, styles.smallCardNoPad]}>
          <Text style={styles.summaryLabel}>Invested</Text>
          <Text style={styles.summaryValue}>
            PKR {formatPKR(totalInvested)}
          </Text>
        </View>

        <View style={[styles.summaryCard, styles.smallCardNoPad]}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.summaryValue}>
            PKR {formatPKR(totalValue)}
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  smallCard: { flex: 1, paddingVertical: 12 },
  smallCardNoPad: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  summaryPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
