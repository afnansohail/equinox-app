import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TrendingUp, TrendingDown, ChevronRight, Moon } from "lucide-react-native";
import StockLogo from "../shared/StockLogo";
import { colors } from "../../constants/theme";
import { formatPKR, formatPercentage } from "../../utils/format";
import { PortfolioHolding } from "../../services/api";

interface HoldingRowProps {
  holding: PortfolioHolding;
  onPress: () => void;
}

export const HoldingRow = React.memo(({ holding, onPress }: HoldingRowProps) => {
  const marketPrice = holding.stock?.currentPrice ?? 0;
  const effectivePrice =
    marketPrice > 0 ? marketPrice : holding.averageBuyPrice;
  const currentValue = effectivePrice * holding.quantity;
  const gainLoss = currentValue - holding.totalInvested;
  const gainLossPct =
    holding.totalInvested > 0 ? (gainLoss / holding.totalInvested) * 100 : 0;
  const isUp = gainLoss >= 0;
  const prevClose = holding.stock?.previousClose ?? 0;
  const todayPnL =
    marketPrice - prevClose !== 0
      ? (marketPrice - prevClose) * holding.quantity
      : 0;
  const todayPct =
    prevClose > 0 ? ((marketPrice - prevClose) / prevClose) * 100 : 0;

  return (
    <TouchableOpacity
      style={styles.holdingRow}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <StockLogo
        logoUrl={holding.stock?.logoUrl}
        symbol={holding.stockSymbol}
        size={44}
      />

      <View style={styles.holdingMeta}>
        <View style={styles.holdingTop}>
          <Text style={styles.holdingSymbol}>{holding.stockSymbol}</Text>
          {holding.stock?.isShariahCompliant && (
            <View style={styles.shariahBadge}>
              <Moon size={12} color={colors.success} />
            </View>
          )}
        </View>
        <Text style={styles.holdingSubtitle} numberOfLines={1}>
          {holding.quantity} shares
        </Text>
        <Text style={styles.holdingSubtitle} numberOfLines={1}>
          {marketPrice > 0 ? `PKR ${marketPrice.toFixed(2)}` : "—"}
        </Text>
      </View>

      <View style={styles.holdingRight}>
        <Text style={styles.holdingValue}>
          PKR {formatPKR(currentValue)}
        </Text>
        <View
          style={[
            styles.gainChip,
            {
              backgroundColor: isUp
                ? "rgba(34,197,94,0.12)"
                : "rgba(239,68,68,0.12)",
              marginTop: 8,
            },
          ]}
        >
          {isUp ? (
            <TrendingUp size={11} color={colors.success} />
          ) : (
            <TrendingDown size={11} color={colors.danger} />
          )}
          <Text
            style={[
              styles.gainChipText,
              { color: isUp ? colors.success : colors.danger },
            ]}
          >
            ALL {formatPercentage(gainLossPct)}
          </Text>
        </View>

        <View
          style={[
            styles.gainChip,
            {
              backgroundColor:
                todayPnL >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              marginTop: 6,
            },
          ]}
        >
          {todayPnL >= 0 ? (
            <TrendingUp size={11} color={colors.success} />
          ) : (
            <TrendingDown size={11} color={colors.danger} />
          )}
          <Text
            style={[
              styles.gainChipText,
              { color: todayPnL >= 0 ? colors.success : colors.danger },
            ]}
          >
            DAY {formatPercentage(todayPct)}
          </Text>
        </View>
      </View>

      <ChevronRight size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  holdingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  holdingMeta: { flex: 1, gap: 4 },
  holdingTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  holdingSymbol: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  shariahBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  holdingSubtitle: { fontSize: 12, color: colors.textSecondary },
  holdingRight: { alignItems: "flex-end", gap: 5 },
  holdingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  gainChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  gainChipText: { fontSize: 11, fontWeight: "600" },
});
