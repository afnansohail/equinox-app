import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
} from "react-native";
import { colors, fonts } from "../../constants/theme";
import { formatPKR } from "../../utils/format";
import RankedBar from "../ui/RankedBar";
import type { Dividend, ScrapedPayoutBySymbol } from "../../services/api";
import {
  buildDividendRanking,
  type RankedDividendStock,
} from "../../utils/dividendRanking";

interface DividendStockRankingProps {
  dividends: Dividend[];
  scrapedPayouts?: ScrapedPayoutBySymbol[];
  selectedSymbol?: string | null;
  holdingMeta?: Array<{
    symbol: string;
    currentPrice?: number;
    peRatio?: number | null;
  }>;
  onSymbolPress?: (symbol: string | null) => void;
}

export default function DividendStockRanking({
  dividends,
  scrapedPayouts,
  selectedSymbol,
  holdingMeta,
  onSymbolPress,
}: DividendStockRankingProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const ranked = useMemo(
    () =>
      buildDividendRanking({
        dividends,
        scrapedPayouts,
        holdingMeta,
      }),
    [dividends, scrapedPayouts, holdingMeta],
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
    const isActive = activeIdx === index;
    const isETF = item.isETF;

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
            ellipsizeMode="tail"
          >
            {item.symbol}
          </Text>
          {isETF ? (
            <Text style={[styles.etfLabel, isActive && styles.etfLabelActive]}>
              Exchange Traded Fund
            </Text>
          ) : (
            <>
              <View style={styles.barTrack}>
                <RankedBar value={scoreValue} trackColor={colors.trackNeutral} />
              </View>
              <Text
                style={[styles.scoreText, isActive && styles.scoreTextActive]}
              >
                {scoreValue}
              </Text>
            </>
          )}
          <Text
            style={[styles.amount, isActive && styles.amountActive]}
            numberOfLines={1}
          >
            {formatPKR(item.totalAmount)}
          </Text>
        </View>

        {isActive && !isETF && (
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
        <Text style={styles.heading}>Score ranking</Text>
        <Text style={styles.labelAmount}>Payout PKR</Text>
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
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heading: {
    fontSize: 16,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  labelAmount: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
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
    gap: 12,
  },
  symbol: {
    width: 44,
    fontSize: 13,
    fontFamily: fonts.sans.extrabold,
    color: colors.textPrimary,
  },
  symbolActive: { color: colors.secondary },
  barTrack: {
    flex: 1,
  },
  scoreText: {
    width: 26,
    fontSize: 13,
    fontFamily: fonts.sans.semibold,
    color: colors.secondary,
    textAlign: "right",
  },
  scoreTextActive: { fontFamily: fonts.sans.bold },
  etfLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
    marginLeft: 8,
  },
  etfLabelActive: { color: colors.secondary },
  amount: {
    width: 46,
    fontSize: 13,
    fontFamily: fonts.sans.semibold,
    color: colors.textSecondary,
    textAlign: "right",
  },
  amountActive: { color: colors.secondary },
  breakdownContainer: {
    gap: 8,
  },
  yieldText: {
    fontSize: 12,
    fontFamily: fonts.sans.bold,
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
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  breakdownChipValue: {
    fontSize: 12,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
});
