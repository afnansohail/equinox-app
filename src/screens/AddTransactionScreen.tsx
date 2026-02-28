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
import { ArrowLeft, Search, Calendar, Plus, Trash2 } from "lucide-react-native";
import DatePickerModal from "../components/ui/DatePickerModal";
import { useAddTransaction, usePortfolio } from "../hooks/usePortfolio";
import { getStock } from "../services/api";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../constants/theme";

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

  // Bulk transaction entries
  const [entries, setEntries] = useState<TransactionEntry[]>([
    {
      id: "1",
      quantity: "",
      price: initialPrice,
      date: new Date(),
    },
  ]);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const hasSymbolParam = !!route.params?.symbol;
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [symbolError, setSymbolError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Oversell guard
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

  const lookupSymbol = async (sym: string) => {
    if (hasSymbolParam || !sym.trim()) return;
    setSymbolLoading(true);
    setSymbolError("");
    try {
      const stock = await getStock(sym.trim().toUpperCase());
      if (stock) {
        setSymbol(stock.symbol);
        // Update all entries without prices
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate && activeEntryId) {
      updateEntry(activeEntryId, "date", selectedDate);
    }
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

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
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
                      <ActivityIndicator
                        size="small"
                        color={colors.secondary}
                      />
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
                      color:
                        availableQty > 0 ? colors.secondary : colors.danger,
                      fontWeight: "700",
                    }}
                  >
                    {availableQty} shares
                  </Text>
                </Text>
              </View>
            )}

            {/* Transaction Entries */}
            <View style={styles.entriesSection}>
              <View style={styles.entriesHeader}>
                <Text style={styles.fieldLabel}>Transaction Details</Text>
                <TouchableOpacity style={styles.addEntryBtn} onPress={addEntry}>
                  <Plus size={16} color={colors.secondary} />
                  <Text style={styles.addEntryText}>Add Entry</Text>
                </TouchableOpacity>
              </View>

              {entries.map((entry, index) => (
                <View key={entry.id} style={styles.entryCard}>
                  {entries.length > 1 && (
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryNumber}>Entry {index + 1}</Text>
                      <TouchableOpacity
                        onPress={() => removeEntry(entry.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 size={18} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.row2}>
                    <View style={[styles.field, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Quantity</Text>
                      <TextInput
                        style={[styles.input, oversell && styles.inputError]}
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
                      <Text style={styles.fieldLabel}>Price (PKR)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        value={entry.price}
                        onChangeText={(v) => updateEntry(entry.id, "price", v)}
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Date</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openDatePicker(entry.id)}
                    >
                      <Calendar size={18} color={colors.textSecondary} />
                      <Text style={styles.dateText}>
                        {entry.date.toLocaleDateString("en-PK", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {Number(entry.quantity) > 0 && Number(entry.price) > 0 && (
                    <View style={styles.entryTotal}>
                      <Text style={styles.entryTotalLabel}>Subtotal:</Text>
                      <Text style={styles.entryTotalValue}>
                        PKR{" "}
                        {(
                          Number(entry.quantity) * Number(entry.price)
                        ).toLocaleString("en-PK", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {oversell && (
              <Text style={styles.symbolError}>
                Total quantity ({totalQuantity}) exceeds available (
                {availableQty})
              </Text>
            )}

            {/* Total Amount */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                PKR{" "}
                {totalAmount.toLocaleString("en-PK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
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
              {submitting ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.submitBtnText}>
                  Save{" "}
                  {entries.length > 1
                    ? `${entries.filter(isValidEntry).length} `
                    : ""}
                  {type === "BUY" ? "Buy" : "Sell"} Transaction
                  {entries.filter(isValidEntry).length > 1 ? "s" : ""}
                </Text>
              )}
            </TouchableOpacity>

            {/* Extra space for keyboard */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Date Picker Modal */}
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
  scroll: { padding: 20, paddingTop: 28, gap: 16 },
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
  // Bulk entry styles
  entriesSection: {
    gap: 12,
  },
  entriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addEntryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(41,253,230,0.12)",
    borderRadius: 8,
  },
  addEntryText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.secondary,
  },
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  entryNumber: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  dateInput: {
    height: 50,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  entryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  entryTotalLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  entryTotalValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
