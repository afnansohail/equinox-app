import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
} from "react-native";
import { colors } from "../../constants/theme";
import { formatPKR } from "../../utils/format";
import type { Dividend, ScrapedPayoutBySymbol } from "../../services/api";
import {
  buildDividendRanking,
  type RankedDividendStock,
} from "../../utils/dividendRanking";

interface DividendStockRankingProps {
  dividends: Dividend[];
  scrapedPayouts?: ScrapedPayoutBySymbol[];
  faceValueBySymbol?: Record<string, number>;
  selectedSymbol?: string | null;
  holdingMeta?: Array<{
    symbol: string;
    currentPrice?: number;
    peRatio?: number | null;
  }>;
  /** Called when a symbol row is tapped. Passes the symbol, or null when deselected. */
  onSymbolPress?: (symbol: string | null) => void;
}

export default function DividendStockRanking({
  dividends,
  scrapedPayouts,
  faceValueBySymbol,
  selectedSymbol,
  holdingMeta,
  onSymbolPress,
}: DividendStockRankingProps) {
  const { width } = useWindowDimensions();
  const barMaxWidth = width - 40 - 68 - 64 - 72 - 40;
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const ranked = useMemo(
    () =>
      buildDividendRanking({
        dividends,
        scrapedPayouts,
        faceValueBySymbol,
        holdingMeta,
      }).filter((stock) => stock.score > 0), // Filter out holdings with 0 score/no dividends
    [dividends, scrapedPayouts, faceValueBySymbol, holdingMeta],
  );

  useEffect(() => {
    if (!ranked.length) {
      setActiveIdx(null);
      return;
    }
    if (!selectedSymbol) {
      setActiveIdx(null);
      return;
    }
    const idx = ranked.findIndex((s) => s.symbol === selectedSymbol);
    setActiveIdx(idx >= 0 ? idx : null);
  }, [selectedSymbol, ranked]);

  function handleSymbolPress(idx: number, symbol: string) {
    if (activeIdx === idx) {
      setActiveIdx(null);
      onSymbolPress?.(null);
    } else {
      setActiveIdx(idx);
      onSymbolPress?.(symbol);
    }
  }

  if (ranked.length === 0) return null;

  const renderRow: ListRenderItem<RankedDividendStock> = ({ item, index }) => {
    const scoreValue = item.score;
    const barWidth =
      (Math.max(0, Math.min(100, scoreValue)) / 100) * barMaxWidth;
    const isActive = activeIdx === index;

    return (
      <TouchableOpacity
        style={[styles.row, isActive && styles.rowActive]}
        onPress={() => handleSymbolPress(index, item.symbol)}
        activeOpacity={0.7}
      >
        <View style={styles.rowTop}>
          <Text
            style={[styles.symbol, isActive && styles.symbolActive]}
            numberOfLines={1}
          >
            {item.symbol}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.bar,
                isActive && styles.barActive,
                { width: barWidth },
              ]}
            />
          </View>
          <Text style={[styles.scoreText, isActive && styles.scoreTextActive]}>
            {item.isETF ? "ETF" : scoreValue}
          </Text>
          <Text
            style={[styles.amount, isActive && styles.amountActive]}
            numberOfLines={1}
          >
            {formatPKR(item.totalAmount)}
          </Text>
        </View>

        {isActive && (
          <View style={styles.breakdownContainer}>
            <Text style={styles.yieldText}>
              Yield: {item.dividendYield.toFixed(2)}%
            </Text>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownChip}>
                <Text style={styles.breakdownChipLabel}>Yield</Text>
                <Text style={styles.breakdownChipValue}>
                  {item.breakdown.yield}/40
                </Text>
              </View>
              <View style={styles.breakdownChip}>
                <Text style={styles.breakdownChipLabel}>Consistency</Text>
                <Text style={styles.breakdownChipValue}>
                  {item.breakdown.consistency}/40
                </Text>
              </View>
              <View style={styles.breakdownChip}>
                <Text style={styles.breakdownChipLabel}>Valuation</Text>
                <Text style={styles.breakdownChipValue}>
                  {item.breakdown.valuation}/20
                </Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Dividend Score Ranking</Text>
      </View>
      <View style={styles.columnLabels}>
        <Text style={styles.labelSymbol}>Symbol</Text>
        <Text style={styles.labelScore}>Score</Text>
        <Text style={styles.labelAmount}>Payout</Text>
      </View>
      <FlatList
        data={ranked}
        renderItem={renderRow}
        keyExtractor={(item) => item.symbol}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  header: { marginBottom: 10 },
  heading: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  columnLabels: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  labelSymbol: {
    width: 60,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  labelScore: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  labelAmount: {
    width: 70,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlign: "right",
  },
  row: {
    gap: 10,
    paddingVertical: 8,
  },
  rowActive: {
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.secondaryMuted,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  symbol: {
    width: 60,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  symbolActive: { color: colors.secondary },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: { height: 8, backgroundColor: colors.secondary, borderRadius: 4 },
  barActive: { backgroundColor: colors.secondary },
  scoreText: {
    width: 56,
    fontSize: 11,
    fontWeight: "600",
    color: colors.secondary,
    textAlign: "center",
  },
  scoreTextActive: { fontWeight: "700" },
  amount: {
    width: 68,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "right",
  },
  amountActive: { color: colors.secondary },
  breakdownContainer: {
    gap: 8,
  },
  yieldText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.secondary,
  },
  breakdownRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  breakdownChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 86,
  },
  breakdownChipLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  breakdownChipValue: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
  },
});
