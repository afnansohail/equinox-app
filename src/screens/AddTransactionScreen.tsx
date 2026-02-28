import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, Search } from "lucide-react-native";
import { useAddTransaction, usePortfolio } from "../hooks/usePortfolio";
import { getStock } from "../services/api";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../constants/theme";

type Route = RouteProp<RootStackParamList, "AddTransaction">;
type Nav = NativeStackNavigationProp<RootStackParamList, "AddTransaction">;

type TxKind = "BUY" | "SELL";

export default function AddTransactionScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const mutation = useAddTransaction();

  const initialSymbol = route.params?.symbol ?? "";
  const initialPrice = route.params?.currentPrice?.toString() ?? "";
  const initialType = route.params?.type ?? "BUY";

  const [symbol, setSymbol] = useState(initialSymbol);
  const [type, setType] = useState<TxKind>(initialType);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(initialPrice);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const hasSymbolParam = !!route.params?.symbol;
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [symbolError, setSymbolError] = useState("");
  const totalAmount = Number(quantity) * Number(price);

  // Oversell guard
  const { data: holdings } = usePortfolio();
  const holding = holdings?.find(
    (h) => h.stockSymbol.toUpperCase() === symbol.toUpperCase(),
  );
  const availableQty = holding?.quantity ?? 0;
  const oversell =
    type === "SELL" && Number(quantity) > availableQty && availableQty >= 0;

  const lookupSymbol = async (sym: string) => {
    if (hasSymbolParam || !sym.trim()) return;
    setSymbolLoading(true);
    setSymbolError("");
    try {
      const stock = await getStock(sym.trim().toUpperCase());
      if (stock) {
        setSymbol(stock.symbol);
        if (!price) setPrice(stock.currentPrice.toString());
      } else {
        setSymbolError("Symbol not found");
      }
    } catch {
      setSymbolError("Could not fetch symbol");
    } finally {
      setSymbolLoading(false);
    }
  };
  const disabled =
    mutation.isPending ||
    !symbol ||
    !quantity ||
    !price ||
    Number(quantity) <= 0 ||
    Number(price) <= 0 ||
    oversell;

  const onSubmit = async () => {
    const qty = Number(quantity);
    const px = Number(price);
    if (!symbol || !qty || !px) return;

    await mutation.mutateAsync({
      stockSymbol: symbol.toUpperCase(),
      transactionType: type,
      quantity: qty,
      pricePerShare: px,
      totalAmount: qty * px,
      transactionDate: date,
      notes: notes || null,
    } as any);

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {type === "SELL" ? "Sell Stock" : "Buy Stock"}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* BUY / SELL Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === "BUY" && styles.typeBtnBuyActive,
              ]}
              onPress={() => setType("BUY")}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  type === "BUY" && styles.typeBtnTextActive,
                ]}
              >
                Buy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === "SELL" && styles.typeBtnSellActive,
              ]}
              onPress={() => setType("SELL")}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  type === "SELL" && {
                    color: colors.danger,
                    fontWeight: "700",
                  },
                ]}
              >
                Sell
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stock Symbol */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Stock Symbol</Text>
            <View style={styles.symbolRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.symbolInput,
                  hasSymbolParam && styles.inputLocked,
                ]}
                placeholder="e.g. OGDC, LUCK, FFC"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={symbol}
                onChangeText={(t) => {
                  setSymbol(t);
                  setSymbolError("");
                }}
                onBlur={() => lookupSymbol(symbol)}
                editable={!hasSymbolParam}
                returnKeyType="search"
                onSubmitEditing={() => lookupSymbol(symbol)}
              />
              {!hasSymbolParam && (
                <TouchableOpacity
                  style={styles.symbolSearchBtn}
                  onPress={() => lookupSymbol(symbol)}
                  disabled={symbolLoading}
                >
                  {symbolLoading ? (
                    <ActivityIndicator size="small" color={colors.secondary} />
                  ) : (
                    <Search size={20} color={colors.secondary} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            {!!symbolError && (
              <Text style={styles.symbolError}>{symbolError}</Text>
            )}
          </View>

          {/* Oversell warning */}
          {type === "SELL" && (
            <View style={styles.holdingHint}>
              <Text style={styles.holdingHintText}>
                Available:{" "}
                <Text
                  style={{
                    color: availableQty > 0 ? colors.secondary : colors.danger,
                    fontWeight: "700",
                  }}
                >
                  {availableQty} shares
                </Text>
              </Text>
            </View>
          )}

          {/* Quantity + Price Row */}
          <View style={styles.row2}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <TextInput
                style={[styles.input, oversell && styles.inputError]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
              {oversell && (
                <Text style={styles.symbolError}>
                  Exceeds available ({availableQty})
                </Text>
              )}
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Price per Share (PKR)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {/* Total Amount */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              PKR{" "}
              {totalAmount.toLocaleString("en-PK", {
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={date}
              onChangeText={setDate}
            />
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[
                styles.input,
                { height: 80, textAlignVertical: "top", paddingTop: 14 },
              ]}
              placeholder="Add a note..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, disabled && styles.submitBtnDisabled]}
            onPress={onSubmit}
            disabled={disabled}
            activeOpacity={0.85}
          >
            {mutation.isPending ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.submitBtnText}>
                Save {type === "BUY" ? "Buy" : "Sell"} Transaction
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: { padding: 20, gap: 16 },
  typeToggle: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  typeBtnBuyActive: {
    backgroundColor: colors.secondary,
  },
  typeBtnSellActive: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  typeBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  typeBtnTextActive: {
    color: colors.textInverse,
    fontWeight: "700",
  },
  field: { gap: 8 },
  symbolRow: { flexDirection: "row", gap: 8 },
  symbolInput: { flex: 1 },
  symbolSearchBtn: {
    width: 50,
    height: 50,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  symbolError: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 2,
  },
  holdingHint: {
    backgroundColor: "rgba(41,253,230,0.07)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(41,253,230,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  holdingHintText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  input: {
    height: 50,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputLocked: {
    opacity: 0.6,
  },
  inputError: {
    borderColor: colors.danger,
  },
  row2: { flexDirection: "row", gap: 12 },
  totalCard: {
    backgroundColor: "rgba(41,253,230,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(41,253,230,0.2)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: { fontSize: 14, color: colors.textSecondary },
  totalValue: { fontSize: 20, fontWeight: "700", color: colors.secondary },
  submitBtn: {
    height: 54,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textInverse,
  },
});
