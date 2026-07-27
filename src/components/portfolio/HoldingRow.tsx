import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Moon } from "lucide-react-native";
import StockLogo from "../shared/StockLogo";
import { colors, fonts } from "../../constants/theme";
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

  return (
    <TouchableOpacity
      style={styles.holdingRow}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <StockLogo
        logoUrl={holding.stock?.logoUrl}
        symbol={holding.stockSymbol}
        size={40}
      />

      <View style={styles.holdingMeta}>
        <View style={styles.holdingTop}>
          <Text style={styles.holdingSymbol}>
            {holding.stockSymbol}{" "}
            <Text style={styles.holdingShares}>
              · {holding.quantity} sh
            </Text>
          </Text>
          {holding.stock?.isShariahCompliant && (
            <View style={styles.shariahBadge}>
              <Moon size={12} color={colors.success} />
            </View>
          )}
        </View>
        <Text style={styles.holdingSubtitle} numberOfLines={1}>
          Avg PKR {holding.averageBuyPrice.toFixed(2)}
        </Text>
      </View>

      <View style={styles.holdingRight}>
        <Text style={styles.holdingValue}>{formatPKR(currentValue)}</Text>
        <Text
          style={[
            styles.holdingPct,
            { color: isUp ? colors.success : colors.danger },
          ]}
        >
          {formatPercentage(gainLossPct)}
        </Text>
      </View>
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
    fontSize: 14,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  holdingShares: {
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  shariahBadge: {
    backgroundColor: colors.successMuted,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  holdingSubtitle: { fontSize: 11, fontFamily: fonts.sans.medium, color: colors.textMuted },
  holdingRight: { alignItems: "flex-end", gap: 3 },
  holdingValue: {
    fontSize: 14,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  holdingPct: {
    fontSize: 12,
    fontFamily: fonts.sans.bold,
  },
});
