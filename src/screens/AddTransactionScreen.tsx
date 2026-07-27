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
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Search,
  Calendar,
  Plus,
  Trash2,
  StickyNote,
} from "lucide-react-native";
import DatePickerModal from "../components/ui/DatePickerModal";
import StockLogo from "../components/shared/StockLogo";
import { useAddTransaction, usePortfolio } from "../hooks/usePortfolio";
import { useStock } from "../hooks/useStocks";
import { getStock, type Stock } from "../services/api";
import type { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../constants/theme";

type Route = RouteProp<RootStackParamList, "AddTransaction">;
type Nav = NativeStackNavigationProp<RootStackParamList, "AddTransaction">;

type TxKind = "BUY" | "SELL";

interface TransactionEntry {
  id: string;
  quantity: string;
  price: string;
  date: Date;
}

export default function AddTransactionScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const mutation = useAddTransaction();

  const initialSymbol = route.params?.symbol ?? "";
  const initialPrice = route.params?.currentPrice?.toString() ?? "";
  const initialType = route.params?.type ?? "BUY";

  const [symbol, setSymbol] = useState(initialSymbol);
  const [type, setType] = useState<TxKind>(initialType);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const [entries, setEntries] = useState<TransactionEntry[]>([
    {
      id: "1",
      quantity: "",
      price: initialPrice,
      date: new Date(),
    },
  ]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const hasSymbolParam = !!route.params?.symbol;
  const [manualStock, setManualStock] = useState<Stock | null>(null);
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [symbolError, setSymbolError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: routeStock } = useStock(hasSymbolParam ? initialSymbol : "");
  const resolvedStock = hasSymbolParam ? (routeStock ?? null) : manualStock;

  const isBuy = type === "BUY";
  const accentColor = isBuy ? colors.secondary : colors.danger;
  const accentMuted = isBuy ? colors.secondaryMuted : colors.dangerMuted;
  const accentGlow = isBuy
    ? colors.secondaryGlow
    : "rgba(255,107,107,0.25)";

  const { data: holdings } = usePortfolio();
  const holding = holdings?.find(
    (h) => h.stockSymbol.toUpperCase() === symbol.toUpperCase(),
  );
  const availableQty = holding?.quantity ?? 0;
  const totalQuantity = entries.reduce(
    (sum, e) => sum + (Number(e.quantity) || 0),
    0,
  );
  const oversell =
    type === "SELL" && totalQuantity > availableQty && availableQty >= 0;

  const totalAmount = entries.reduce((sum, e) => {
    return sum + (Number(e.quantity) || 0) * (Number(e.price) || 0);
  }, 0);
  const avgPrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;
  const realizedPnL = entries.reduce((sum, e) => {
    const qty = Number(e.quantity) || 0;
    const price = Number(e.price) || 0;
    if (qty <= 0 || !holding) return sum;
    return sum + (price - holding.averageBuyPrice) * qty;
  }, 0);
  const realizedPositive = realizedPnL >= 0;

  const lookupSymbol = async (sym: string) => {
    if (hasSymbolParam || !sym.trim()) return;
    setSymbolLoading(true);
    setSymbolError("");
    try {
      const stock = await getStock(sym.trim().toUpperCase());
      if (stock) {
        setSymbol(stock.symbol);
        setManualStock(stock);
        setEntries((prev) =>
          prev.map((e) =>
            !e.price ? { ...e, price: stock.currentPrice.toString() } : e,
          ),
        );
      } else {
        setSymbolError("Symbol not found");
      }
    } catch {
      setSymbolError("Could not fetch symbol");
    } finally {
      setSymbolLoading(false);
    }
  };

  const clearResolvedSymbol = () => {
    if (hasSymbolParam) return;
    setManualStock(null);
    setSymbol("");
    setSymbolError("");
  };

  const addEntry = () => {
    setEntries((prev) => [
      {
        id: Date.now().toString(),
        quantity: "",
        price: initialPrice,
        date: new Date(),
      },
      ...prev,
    ]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const updateEntry = (
    id: string,
    field: keyof TransactionEntry,
    value: any,
  ) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };

  const openDatePicker = (entryId: string) => {
    setActiveEntryId(entryId);
    setShowDatePicker(true);
  };

  const isValidEntry = (e: TransactionEntry) =>
    Number(e.quantity) > 0 && Number(e.price) > 0;

  const disabled =
    submitting || !symbol || entries.every((e) => !isValidEntry(e)) || oversell;

  const onSubmit = async () => {
    const validEntries = entries.filter(isValidEntry);
    if (!symbol || validEntries.length === 0) return;

    setSubmitting(true);
    try {
      for (const entry of validEntries) {
        const qty = Number(entry.quantity);
        const px = Number(entry.price);
        await mutation.mutateAsync({
          stockSymbol: symbol.toUpperCase(),
          transactionType: type,
          quantity: qty,
          pricePerShare: px,
          totalAmount: qty * px,
          transactionDate: entry.date.toISOString().slice(0, 10),
          notes: notes || null,
        } as any);
      }
      navigation.goBack();
    } catch (error: any) {
      console.error("Error submitting transactions:", error);
      Alert.alert(
        "Transaction Failed",
        error?.message || "Failed to save transaction. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record a trade</Text>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === "BUY" && { backgroundColor: colors.secondary },
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
                  type === "SELL" && { backgroundColor: colors.danger },
                ]}
                onPress={() => setType("SELL")}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    type === "SELL" && styles.typeBtnTextActive,
                  ]}
                >
                  Sell
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Stock symbol</Text>

              {resolvedStock ? (
                <TouchableOpacity
                  style={[
                    styles.stockChip,
                    { borderColor: accentGlow },
                  ]}
                  onPress={clearResolvedSymbol}
                  activeOpacity={hasSymbolParam ? 1 : 0.7}
                  disabled={hasSymbolParam}
                >
                  <StockLogo
                    logoUrl={resolvedStock.logoUrl}
                    symbol={resolvedStock.symbol}
                    size={36}
                  />
                  <View style={styles.stockChipMeta}>
                    <Text style={styles.stockChipSymbol}>
                      {resolvedStock.symbol}
                    </Text>
                    <Text style={styles.stockChipName} numberOfLines={1}>
                      {resolvedStock.name}
                    </Text>
                  </View>
                  <View style={styles.stockChipRight}>
                    <Text style={styles.stockChipPrice}>
                      {resolvedStock.currentPrice.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        styles.stockChipPct,
                        {
                          color:
                            resolvedStock.changePercent >= 0
                              ? colors.success
                              : colors.danger,
                        },
                      ]}
                    >
                      {resolvedStock.changePercent >= 0 ? "+" : ""}
                      {resolvedStock.changePercent.toFixed(2)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.symbolRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. OGDC, LUCK, FFC"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    value={symbol}
                    onChangeText={(t) => {
                      setSymbol(t);
                      setSymbolError("");
                    }}
                    onBlur={() => lookupSymbol(symbol)}
                    returnKeyType="search"
                    onSubmitEditing={() => lookupSymbol(symbol)}
                  />
                  <TouchableOpacity
                    style={styles.symbolSearchBtn}
                    onPress={() => lookupSymbol(symbol)}
                    disabled={symbolLoading}
                  >
                    {symbolLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.secondary}
                      />
                    ) : (
                      <Search size={20} color={colors.secondary} />
                    )}
                  </TouchableOpacity>
                </View>
              )}
              {!!symbolError && (
                <Text style={styles.symbolError}>{symbolError}</Text>
              )}
            </View>

            {type === "SELL" && (
              <View style={styles.holdingHint}>
                <Text style={styles.holdingHintLabel}>Available to sell</Text>
                <Text style={styles.holdingHintValue}>
                  {availableQty} shares
                  {holding
                    ? ` · avg PKR ${holding.averageBuyPrice.toFixed(2)}`
                    : ""}
                </Text>
              </View>
            )}

            <View style={styles.entriesSection}>
              <View style={styles.entriesHeader}>
                <Text style={styles.entriesLabel}>
                  Entries · {entries.length}
                </Text>
                <TouchableOpacity
                  style={[styles.addEntryBtn, { backgroundColor: accentMuted }]}
                  onPress={addEntry}
                >
                  <Plus size={14} color={accentColor} />
                  <Text style={[styles.addEntryText, { color: accentColor }]}>
                    Add entry
                  </Text>
                </TouchableOpacity>
              </View>

              {entries.map((entry, index) => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={[styles.entryNumber, { color: accentColor }]}>
                      Entry {index + 1}
                    </Text>
                    {entries.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeEntry(entry.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 size={16} color={colors.textDim} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.row2}>
                    <View style={[styles.field, { flex: 1 }]}>
                      <Text style={styles.entryFieldLabel}>Quantity</Text>
                      <TextInput
                        style={[
                          styles.entryInput,
                          oversell && styles.inputError,
                        ]}
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        value={entry.quantity}
                        onChangeText={(v) =>
                          updateEntry(entry.id, "quantity", v)
                        }
                      />
                    </View>
                    <View style={[styles.field, { flex: 1 }]}>
                      <Text style={styles.entryFieldLabel}>Price (PKR)</Text>
                      <TextInput
                        style={styles.entryInput}
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        value={entry.price}
                        onChangeText={(v) => updateEntry(entry.id, "price", v)}
                      />
                    </View>
                  </View>

                  <View style={styles.entryBottomRow}>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openDatePicker(entry.id)}
                    >
                      <Calendar size={15} color={colors.textMuted} />
                      <Text style={styles.dateText}>
                        {entry.date.toLocaleDateString("en-PK", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </TouchableOpacity>

                    {Number(entry.quantity) > 0 && Number(entry.price) > 0 && (
                      <View style={styles.entrySubtotal}>
                        <Text style={styles.entrySubtotalLabel}>Subtotal</Text>
                        <Text style={styles.entrySubtotalValue}>
                          PKR{" "}
                          {(
                            Number(entry.quantity) * Number(entry.price)
                          ).toLocaleString("en-PK", {
                            maximumFractionDigits: 0,
                          })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {oversell && (
              <Text style={styles.symbolError}>
                Total quantity ({totalQuantity}) exceeds available (
                {availableQty})
              </Text>
            )}

            {showNotes && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Add a note..."
                  placeholderTextColor={colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  autoFocus
                />
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </TouchableWithoutFeedback>

        <View style={styles.footer}>
          <View style={styles.footerTopRow}>
            <View>
              {type === "BUY" ? (
                <Text style={styles.footerMeta}>
                  {totalQuantity} shares · avg PKR {avgPrice.toFixed(2)}
                </Text>
              ) : (
                <Text style={styles.footerMeta}>
                  {totalQuantity} shares · realised P/L{" "}
                  <Text
                    style={{
                      color: realizedPositive ? colors.success : colors.danger,
                      fontFamily: fonts.sans.bold,
                    }}
                  >
                    {realizedPositive ? "+" : "-"}PKR{" "}
                    {Math.abs(realizedPnL).toLocaleString("en-PK", {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                </Text>
              )}
              <Text style={styles.footerTotal}>
                PKR{" "}
                {totalAmount.toLocaleString("en-PK", {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
            {!showNotes && (
              <TouchableOpacity
                style={styles.addNoteBtn}
                onPress={() => setShowNotes(true)}
              >
                <StickyNote size={14} color={colors.textMuted} />
                <Text style={styles.addNoteText}>Add note</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: accentColor },
              disabled && styles.submitBtnDisabled,
            ]}
            onPress={onSubmit}
            disabled={disabled}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator
                color={isBuy ? colors.textInverse : colors.textOnCoral}
              />
            ) : (
              <Text
                style={[
                  styles.submitBtnText,
                  { color: isBuy ? colors.textInverse : colors.textOnCoral },
                ]}
              >
                Save {isBuy ? "buy" : "sell"} transaction
                {entries.filter(isValidEntry).length > 1 ? "s" : ""}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <DatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelect={(date) => {
            if (activeEntryId) {
              updateEntry(activeEntryId, "date", date);
            }
          }}
          selectedDate={
            entries.find((e) => e.id === activeEntryId)?.date || new Date()
          }
          maximumDate={new Date()}
        />
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  scroll: { padding: 20, paddingTop: 8, gap: 16 },
  typeToggle: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  typeBtnText: {
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  typeBtnTextActive: {
    color: colors.textInverse,
    fontFamily: fonts.sans.extrabold,
  },
  field: { gap: 10 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.12,
  },
  symbolRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    height: 56,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
  },
  symbolSearchBtn: {
    width: 56,
    height: 56,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  symbolError: {
    fontSize: 12,
    color: colors.danger,
  },
  stockChip: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
  },
  stockChipMeta: { flex: 1, gap: 1 },
  stockChipSymbol: {
    fontSize: 15,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  stockChipName: {
    fontSize: 11,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
  },
  stockChipRight: { alignItems: "flex-end", gap: 1 },
  stockChipPrice: {
    fontSize: 13,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  stockChipPct: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
  },
  holdingHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dangerMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.18)",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  holdingHintLabel: {
    fontSize: 12,
    fontFamily: fonts.sans.medium,
    color: colors.textSecondary,
  },
  holdingHintValue: {
    fontSize: 13,
    fontFamily: fonts.sans.bold,
    color: colors.danger,
  },
  entriesSection: { gap: 12 },
  entriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entriesLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.12,
  },
  addEntryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
  },
  addEntryText: {
    fontSize: 12,
    fontFamily: fonts.sans.bold,
  },
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryNumber: {
    fontSize: 11,
    fontFamily: fonts.sans.bold,
    textTransform: "uppercase",
    letterSpacing: 0.12,
  },
  row2: { flexDirection: "row", gap: 10 },
  entryFieldLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
  },
  entryInput: {
    height: 44,
    backgroundColor: colors.trackDeep,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  entryBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  dateInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.trackDeep,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
  },
  entrySubtotal: { alignItems: "flex-end", gap: 1 },
  entrySubtotalLabel: {
    fontSize: 10,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
  },
  entrySubtotalValue: {
    fontSize: 14,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  notesInput: {
    height: undefined,
    minHeight: 64,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: "top",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  footerTopRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  footerMeta: {
    fontSize: 11,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
  },
  footerTotal: {
    fontSize: 20,
    fontFamily: fonts.sans.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.02,
    marginTop: 2,
  },
  addNoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingBottom: 4,
  },
  addNoteText: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  submitBtn: {
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: {
    fontSize: 15,
    fontFamily: fonts.sans.extrabold,
  },
});
