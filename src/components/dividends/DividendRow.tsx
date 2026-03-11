import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Trash2, Edit3 } from "lucide-react-native";
import StockLogo from "../shared/StockLogo";
import { colors } from "../../constants/theme";
import { formatPKR } from "../../utils/format";
import type { Dividend } from "../../services/api";

interface DividendRowProps {
  dividend: Dividend;
  onEdit: (dividend: Dividend) => void;
  onDelete: (id: string) => void;
}

export const DividendRow = memo(function DividendRow({
  dividend,
  onEdit,
  onDelete,
}: DividendRowProps) {
  const handleDelete = () => {
    Alert.alert(
      "Delete Dividend",
      `Remove dividend record for ${dividend.stockSymbol}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(dividend.id),
        },
      ],
    );
  };

  return (
    <View style={styles.row}>
      <StockLogo
        logoUrl={dividend.stockLogoUrl}
        symbol={dividend.stockSymbol}
        size={44}
      />

      <View style={styles.meta}>
        <Text style={styles.symbol}>{dividend.stockSymbol}</Text>
        <Text style={styles.detail}>
          {dividend.shares.toLocaleString("en-PK", {
            maximumFractionDigits: 0,
          })}{" "}
          shares × PKR {dividend.dividendPerShare.toFixed(2)}
        </Text>
        <Text style={styles.date}>{dividend.paymentDate}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.total}>
          PKR {formatPKR(dividend.totalAmount, { maximumFractionDigits: 2 })}
        </Text>
        {dividend.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {dividend.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit(dividend)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Edit3 size={16} color={colors.iconMuted} />
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color={colors.textMuted} />
        </TouchableOpacity> */}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  meta: { flex: 1, gap: 3 },
  symbol: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  detail: { fontSize: 12, color: colors.textSecondary },
  date: { fontSize: 11, color: colors.textMuted },
  right: { alignItems: "flex-end", gap: 3 },
  total: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.secondary,
  },
  notes: {
    fontSize: 11,
    color: colors.textMuted,
    maxWidth: 100,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtn: {
    padding: 4,
  },
  deleteBtn: {
    padding: 4,
  },
});
