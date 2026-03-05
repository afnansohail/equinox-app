import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  FlatList,
  ListRenderItem,
} from "react-native";
import { colors } from "../../constants/theme";
import { formatPKR, formatPercentage } from "../../utils/format";
import type { Dividend } from "../../services/api";

interface DividendStockRankingProps {
  dividends: Dividend[];
}

interface StockAgg {
  symbol: string;
  totalAmount: number;
  avgDividendPerShare: number;
  recordCount: number;
}

export default function DividendStockRanking({
  dividends,
}: DividendStockRankingProps) {
  const { width } = useWindowDimensions();
  // Available bar width: screen - horizontal padding (40) - symbol (68) - divYield (60) - amount (72) - gaps
  const barMaxWidth = width - 40 - 68 - 60 - 72 - 40;

  const ranked = useMemo(() => {
    const map = new Map<
      string,
      {
        totalAmount: number;
        totalDivPerShare: number;
        recordCount: number;
      }
    >();

    for (const d of dividends) {
      const existing = map.get(d.stockSymbol) || {
        totalAmount: 0,
        totalDivPerShare: 0,
        recordCount: 0,
      };
      map.set(d.stockSymbol, {
        totalAmount: existing.totalAmount + d.totalAmount,
        totalDivPerShare: existing.totalDivPerShare + d.dividendPerShare,
        recordCount: existing.recordCount + 1,
      });
    }

    const results: StockAgg[] = [...map.entries()].map(([symbol, data]) => ({
      symbol,
      totalAmount: data.totalAmount,
      avgDividendPerShare: data.totalDivPerShare / data.recordCount,
      recordCount: data.recordCount,
    }));

    return results
      .sort((a, b) => b.avgDividendPerShare - a.avgDividendPerShare)
      .slice(0, 7);
  }, [dividends]);

  if (ranked.length === 0) return null;

  const maxAmount = Math.max(...ranked.map((r) => r.avgDividendPerShare));

  const renderRow: ListRenderItem<StockAgg> = ({ item }) => {
    const barWidth =
      maxAmount > 0 ? (item.avgDividendPerShare / maxAmount) * barMaxWidth : 0;
    return (
      <View key={item.symbol} style={styles.row}>
        <Text style={styles.symbol} numberOfLines={1}>
          {item.symbol}
        </Text>

        <View style={styles.barTrack}>
          <View style={[styles.bar, { width: barWidth }]} />
        </View>

        <Text style={styles.divYield}>
          {formatPercentage(item.avgDividendPerShare, false)}
        </Text>

        <Text style={styles.amount} numberOfLines={1}>
          {formatPKR(item.totalAmount)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Top Dividend Shares</Text>
      </View>

      <View style={styles.columnLabels}>
        <Text style={styles.labelSymbol}>Symbol</Text>
        <Text style={styles.labelDiv}>Avg Div</Text>
        <Text style={styles.labelAmount}>Total</Text>
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
  header: {
    marginBottom: 10,
  },
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
  labelDiv: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  labelAmount: {
    width: 68,
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
  symbol: {
    width: 60,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: 8,
    backgroundColor: colors.secondary,
    borderRadius: 4,
  },
  divYield: {
    width: 56,
    fontSize: 11,
    fontWeight: "600",
    color: colors.secondary,
    textAlign: "center",
  },
  amount: {
    width: 68,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "right",
  },
});
