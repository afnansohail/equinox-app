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
import type { Dividend } from "../../services/api";

interface DividendStockRankingProps {
  dividends: Dividend[];
  selectedSymbol?: string | null;
  /** Called when a symbol row is tapped. Passes the symbol, or null when deselected. */
  onSymbolPress?: (symbol: string | null) => void;
}

interface StockAgg {
  symbol: string;
  totalAmount: number;
  avgAnnualDivPerShare: number;
  /** null when currentPrice or peRatio is unavailable */
  dividendScore: number | null;
  recordCount: number;
}

export default function DividendStockRanking({
  dividends,
  selectedSymbol,
  onSymbolPress,
}: DividendStockRankingProps) {
  const { width } = useWindowDimensions();
  const barMaxWidth = width - 40 - 68 - 64 - 72 - 40;
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const ranked = useMemo(() => {
    const map = new Map<
      string,
      {
        totalAmount: number;
        yearlyDivPerShare: Map<number, number>;
        currentPrice: number;
        peRatio: number | null;
        recordCount: number;
      }
    >();

    for (const d of dividends) {
      const year = new Date(d.paymentDate).getFullYear();
      const existing = map.get(d.stockSymbol) ?? {
        totalAmount: 0,
        yearlyDivPerShare: new Map<number, number>(),
        currentPrice: d.stockCurrentPrice ?? 0,
        peRatio: d.stockPeRatio ?? null,
        recordCount: 0,
      };
      existing.totalAmount += d.totalAmount;
      existing.yearlyDivPerShare.set(
        year,
        (existing.yearlyDivPerShare.get(year) ?? 0) + d.dividendPerShare,
      );
      existing.recordCount += 1;
      if (d.stockCurrentPrice) existing.currentPrice = d.stockCurrentPrice;
      if (d.stockPeRatio != null) existing.peRatio = d.stockPeRatio;
      map.set(d.stockSymbol, existing);
    }

    const results: StockAgg[] = [...map.entries()].map(([symbol, data]) => {
      const yearlySums = [...data.yearlyDivPerShare.values()];
      const avgAnnualDivPerShare =
        yearlySums.reduce((a, b) => a + b, 0) / yearlySums.length;

      let dividendScore: number | null = null;
      if (data.currentPrice > 0) {
        if (data.peRatio != null && data.peRatio > 0) {
          dividendScore = Math.ceil(
            (avgAnnualDivPerShare / (data.currentPrice * data.peRatio)) * 10000,
          );
        } else {
          dividendScore = null;
        }
      }

      return {
        symbol,
        totalAmount: data.totalAmount,
        avgAnnualDivPerShare,
        dividendScore,
        recordCount: data.recordCount,
      };
    });

    return results.sort((a, b) => {
      if (a.dividendScore == null && b.dividendScore == null) return 0;
      if (a.dividendScore == null) return 1;
      if (b.dividendScore == null) return -1;
      return b.dividendScore - a.dividendScore;
    });
  }, [dividends]);

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

  const maxScore = Math.max(...ranked.map((r) => r.dividendScore ?? 0));

  const renderRow: ListRenderItem<StockAgg> = ({ item, index }) => {
    const scoreValue = item.dividendScore;
    const barWidth =
      maxScore > 0 && scoreValue != null
        ? (scoreValue / maxScore) * barMaxWidth
        : 0;
    const isActive = activeIdx === index;
    const scoreDisplay = scoreValue != null ? scoreValue : "ETF";

    return (
      <TouchableOpacity
        style={[styles.row, isActive && styles.rowActive]}
        onPress={() => handleSymbolPress(index, item.symbol)}
        activeOpacity={0.7}
      >
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
          {scoreDisplay}
        </Text>
        <Text
          style={[styles.amount, isActive && styles.amountActive]}
          numberOfLines={1}
        >
          {formatPKR(item.totalAmount)}
        </Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  rowActive: {
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.secondaryMuted,
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
});
