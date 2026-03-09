import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import { colors } from "../../constants/theme";
import { formatPKR, formatPercentage } from "../../utils/format";
import { Transaction } from "../../services/api";

interface RealizedHistoryProps {
  transactions: Transaction[];
  txPnL: Record<string, number>;
  totalRealizedPnL: number;
  totalRealizedCost: number;
  totalRealizedPct: number;
  realizedIsPositive: boolean;
}

export const RealizedHistory = React.memo(
  ({
    transactions,
    txPnL,
    totalRealizedPnL,
    totalRealizedCost,
    totalRealizedPct,
    realizedIsPositive,
  }: RealizedHistoryProps) => {
    if (transactions.length === 0) return null;

    return (
      <View style={styles.historySection}>
        <View style={styles.historyDivider} />
        <Text style={styles.sectionTitle}>Sold Shares History</Text>

        <View
          style={[
            styles.summaryCard,
            styles.realizedCard,
            {
              borderColor: realizedIsPositive
                ? "rgba(34,197,94,0.3)"
                : "rgba(239,68,68,0.3)",
            },
          ]}
        >
          <Text style={styles.summaryLabel}>Total Realized P/L</Text>
          <View style={styles.realizedValueRow}>
            <Text
              style={[
                styles.summaryValue,
                { color: realizedIsPositive ? colors.success : colors.danger },
              ]}
            >
              {realizedIsPositive ? "+" : "-"}PKR{" "}
              {formatPKR(Math.abs(totalRealizedPnL))}
            </Text>
            {totalRealizedCost > 0 && (
              <View
                style={[
                  styles.summaryPill,
                  {
                    backgroundColor: realizedIsPositive
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(239,68,68,0.12)",
                  },
                ]}
              >
                {realizedIsPositive ? (
                  <TrendingUp size={11} color={colors.success} />
                ) : (
                  <TrendingDown size={11} color={colors.danger} />
                )}
                <Text
                  style={[
                    styles.summaryPillText,
                    {
                      color: realizedIsPositive
                        ? colors.success
                        : colors.danger,
                    },
                  ]}
                >
                  {formatPercentage(totalRealizedPct)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {transactions.map((tx) => {
          const pnl = txPnL[tx.id] ?? 0;
          const isPos = pnl >= 0;

          return (
            <View key={tx.id} style={styles.soldTxCard}>
              <View>
                <Text style={styles.soldTxSymbol}>{tx.stockSymbol}</Text>
                <Text style={styles.soldTxMeta}>
                  {tx.quantity} shares @ PKR {tx.pricePerShare.toFixed(2)}
                </Text>
                <Text style={styles.soldTxDate}>{tx.transactionDate}</Text>
              </View>
              <View style={styles.soldTxRight}>
                <Text style={styles.soldTxAmount}>
                  PKR {formatPKR(tx.totalAmount)}
                </Text>
                <Text
                  style={[
                    styles.soldTxPnL,
                    { color: isPos ? colors.success : colors.danger },
                  ]}
                >
                  {isPos ? "+" : "-"}PKR {formatPKR(Math.abs(pnl))}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  historySection: {
    marginTop: 8,
    marginBottom: 18,
    gap: 10,
  },
  historyDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  realizedCard: {
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  realizedValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
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
  soldTxCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  soldTxSymbol: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  soldTxMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  soldTxDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  soldTxRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  soldTxAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  soldTxPnL: {
    fontSize: 11,
    fontWeight: "600",
  },
  soldTxStatus: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.danger,
  },
});
