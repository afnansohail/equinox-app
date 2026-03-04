import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ArrowUpRight, ArrowDownRight } from "lucide-react-native";
import { colors } from "../../constants/theme";
import { formatPKR } from "../../utils/format";
import { Transaction } from "../../services/api";

interface RecentActivityProps {
  transactions: Transaction[];
  onViewAll: () => void;
}

export const RecentActivity = React.memo(({
  transactions,
  onViewAll,
}: RecentActivityProps) => {
  if (transactions.length === 0) return null;

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest activity</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.seeAllText}>View all →</Text>
        </TouchableOpacity>
      </View>
      {transactions.map((tx) => {
        const isBuy = tx.transactionType === "BUY";
        return (
          <View key={tx.id} style={styles.txRow}>
            <View
              style={[
                styles.txIconCircle,
                {
                  backgroundColor: isBuy
                    ? "rgba(34,197,94,0.12)"
                    : "rgba(239,68,68,0.12)",
                },
              ]}
            >
              {isBuy ? (
                <ArrowUpRight size={18} color={colors.success} />
              ) : (
                <ArrowDownRight size={18} color={colors.danger} />
              )}
            </View>
            <View style={styles.txMeta}>
              <Text style={styles.txTitle}>
                {isBuy ? "Bought" : "Sold"} {tx.quantity} {tx.stockSymbol}
              </Text>
              <Text style={styles.txDate}>{tx.transactionDate}</Text>
            </View>
            <View style={styles.txRight}>
              <Text style={styles.txAmount}>
                PKR {formatPKR(tx.totalAmount)}
              </Text>
              <Text
                style={[
                  styles.txStatus,
                  { color: !isBuy ? colors.danger : colors.success },
                ]}
              >
                {isBuy ? "Bought" : "Sold"}
              </Text>
            </View>
          </View>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: "500",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  txIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  txMeta: {
    flex: 1,
    gap: 3,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  txDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  txRight: {
    alignItems: "flex-end",
    gap: 3,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  txStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
});
