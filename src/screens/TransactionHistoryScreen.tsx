import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react-native";
import { useTransactions } from "../hooks/usePortfolio";
import { colors } from "../constants/theme";

type FilterType = "all" | "BUY" | "SELL";

export default function TransactionHistoryScreen() {
  const navigation = useNavigation();
  const { data: transactions, isLoading } = useTransactions();
  const [filter, setFilter] = useState<FilterType>("all");

  const displayTx =
    transactions?.filter((tx) =>
      filter === "all" ? true : tx.transactionType === filter,
    ) ?? [];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {(["all", "BUY", "SELL"] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "all" ? "All" : f === "BUY" ? "Buys" : "Sells"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {displayTx.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No transactions</Text>
            <Text style={styles.emptySubtitle}>
              {filter !== "all"
                ? `No ${filter === "BUY" ? "buy" : "sell"} transactions found`
                : "Add your first transaction from a stock page"}
            </Text>
          </View>
        ) : (
          displayTx.map((tx) => {
            const isBuy = tx.transactionType === "BUY";
            return (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txLeft}>
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
                      <ArrowUpRight size={18} color="#22C55E" />
                    ) : (
                      <ArrowDownRight size={18} color={colors.danger} />
                    )}
                  </View>
                  <View style={styles.txMeta}>
                    <View style={styles.txTopRow}>
                      <Text style={styles.txSymbol}>{tx.stockSymbol}</Text>
                      <View
                        style={[
                          styles.txTypeBadge,
                          {
                            backgroundColor: isBuy
                              ? "rgba(34,197,94,0.12)"
                              : "rgba(239,68,68,0.12)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.txTypeBadgeText,
                            { color: isBuy ? "#22C55E" : colors.danger },
                          ]}
                        >
                          {tx.transactionType}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.txDetail}>
                      {tx.quantity} shares @ PKR {tx.pricePerShare.toFixed(2)}
                    </Text>
                    <Text style={styles.txDate}>{tx.transactionDate}</Text>
                    {tx.notes && (
                      <Text style={styles.txNotes} numberOfLines={1}>
                        {tx.notes}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txAmount}>
                    PKR{" "}
                    {tx.totalAmount.toLocaleString("en-PK", {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.txStatus,
                      { color: isBuy ? colors.danger : "#22C55E" },
                    ]}
                  >
                    {isBuy ? "Debited" : "Credited"}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.textPrimary,
    borderColor: "transparent",
  },
  filterText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  filterTextActive: { color: colors.textInverse },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  empty: {
    paddingTop: 60,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  txCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  txLeft: { flex: 1, flexDirection: "row", gap: 12 },
  txIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  txMeta: { flex: 1, gap: 3 },
  txTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  txSymbol: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  txTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txTypeBadgeText: { fontSize: 11, fontWeight: "700" },
  txDetail: { fontSize: 13, color: colors.textSecondary },
  txDate: { fontSize: 12, color: colors.textMuted },
  txNotes: { fontSize: 12, color: colors.textMuted, fontStyle: "italic" },
  txRight: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  txAmount: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  txStatus: { fontSize: 12, fontWeight: "500" },
});
