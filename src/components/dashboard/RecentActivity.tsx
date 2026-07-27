import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ArrowUpRight, ArrowDownRight } from "lucide-react-native";
import { colors, fonts } from "../../constants/theme";
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
          <Text style={styles.seeAllText}>View all</Text>
        </TouchableOpacity>
      </View>
      {transactions.map((tx, idx) => {
        const isBuy = tx.transactionType === "BUY";
        return (
          <View key={tx.id}>
            {idx > 0 && <View style={styles.divider} />}
            <View style={styles.txRow}>
              <View
                style={[
                  styles.txIconCircle,
                  {
                    backgroundColor: isBuy
                      ? colors.secondaryMuted
                      : colors.dangerMuted,
                  },
                ]}
              >
                {isBuy ? (
                  <ArrowUpRight size={16} color={colors.secondary} />
                ) : (
                  <ArrowDownRight size={16} color={colors.danger} />
                )}
              </View>
              <View style={styles.txMeta}>
                <Text style={styles.txTitle}>
                  {isBuy ? "Bought" : "Sold"} {tx.quantity} {tx.stockSymbol}
                </Text>
                <Text style={styles.txDate}>{tx.transactionDate}</Text>
              </View>
              <Text style={styles.txAmount}>
                PKR {formatPKR(tx.totalAmount)}
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
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: fonts.sans.bold,
    color: colors.secondary,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  txMeta: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
  },
  txDate: {
    fontSize: 11,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
  },
  txAmount: {
    fontSize: 14,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
});
