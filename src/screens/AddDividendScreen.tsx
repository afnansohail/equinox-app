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
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, Search, Calendar } from "lucide-react-native";
import DatePickerModal from "../components/ui/DatePickerModal";
import { useAddDividend } from "../hooks/useDividends";
import { getStock } from "../services/api";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../constants/theme";

type Route = RouteProp<RootStackParamList, "AddDividend">;
type Nav = NativeStackNavigationProp<RootStackParamList, "AddDividend">;

export default function AddDividendScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const mutation = useAddDividend();

  const initialSymbol = route.params?.symbol ?? "";
  const hasSymbolParam = !!route.params?.symbol;

  const [symbol, setSymbol] = useState(initialSymbol);
  const [shares, setShares] = useState("");
  const [dividendPerShare, setDividendPerShare] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [inputMode, setInputMode] = useState<"perShare" | "totalAmount">(
    "perShare",
  );
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [symbolHint, setSymbolHint] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sharesNum = Number(shares);
  const perShareNum = Number(dividendPerShare);
  const totalAmountNum = Number(totalAmount);

  // Calculate based on input mode
  const totalPreview =
    inputMode === "perShare"
      ? sharesNum > 0 &&
        perShareNum >= 0 &&
        !isNaN(sharesNum) &&
        !isNaN(perShareNum)
        ? sharesNum * perShareNum
        : null
      : totalAmountNum > 0 && !isNaN(totalAmountNum)
        ? totalAmountNum
        : null;

  const calculatedDividendPerShare =
    inputMode === "totalAmount" &&
    sharesNum > 0 &&
    totalAmountNum > 0 &&
    !isNaN(sharesNum) &&
    !isNaN(totalAmountNum)
      ? totalAmountNum / sharesNum
      : perShareNum;

  const lookupSymbol = async (sym: string) => {
    if (hasSymbolParam || !sym.trim()) return;
    setSymbolLoading(true);
    setSymbolHint("");
    try {
      const stock = await getStock(sym.trim().toUpperCase());
      if (stock) {
        setSymbol(stock.symbol);
        setSymbolHint("");
      } else {
        setSymbolHint("Symbol not found — will be saved as entered");
      }
    } catch {
      setSymbolHint("Could not fetch symbol — will be saved as entered");
    } finally {
      setSymbolLoading(false);
    }
  };

  const disabled =
    submitting ||
    !symbol.trim() ||
    !(sharesNum > 0) ||
    isNaN(sharesNum) ||
    (inputMode === "perShare"
      ? !(perShareNum >= 0) || isNaN(perShareNum)
      : !(totalAmountNum > 0) || isNaN(totalAmountNum));

  const onSubmit = async () => {
    if (disabled) return;
    setSubmitting(true);
    try {
      const finalDividendPerShare =
        inputMode === "totalAmount" ? totalAmountNum / sharesNum : perShareNum;

      await mutation.mutateAsync({
        stockSymbol: symbol.trim().toUpperCase(),
        shares: sharesNum,
        dividendPerShare: finalDividendPerShare,
        paymentDate: paymentDate.toISOString().slice(0, 10),
        notes: notes.trim() || null,
      });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Failed to Save",
        error?.message || "Could not save dividend. Please try again.",
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
          <Text style={styles.headerTitle}>Add Dividend</Text>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Symbol */}
            <Text style={styles.fieldLabel}>Stock Symbol</Text>
            <View style={styles.symbolRow}>
              <TextInput
                style={styles.symbolInput}
                placeholder="e.g. ENGRO"
                placeholderTextColor={colors.textMuted}
                value={symbol}
                onChangeText={(t) => {
                  setSymbol(t);
                  setSymbolHint("");
                }}
                autoCapitalize="characters"
                editable={!hasSymbolParam && !symbolLoading}
                returnKeyType="search"
                onSubmitEditing={() => lookupSymbol(symbol)}
              />
              {!hasSymbolParam && (
                <TouchableOpacity
                  style={[
                    styles.searchBtn,
                    (symbolLoading || !symbol.trim()) &&
                      styles.searchBtnDisabled,
                  ]}
                  onPress={() => lookupSymbol(symbol)}
                  activeOpacity={0.8}
                  disabled={symbolLoading || !symbol.trim()}
                >
                  {symbolLoading ? (
                    <ActivityIndicator size="small" color={colors.secondary} />
                  ) : (
                    <Search size={20} color={colors.secondary} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            {!!symbolHint && <Text style={styles.fieldHint}>{symbolHint}</Text>}

            {/* Input Mode Toggle */}
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.modeToggleBtn,
                  inputMode === "perShare" && styles.modeToggleBtnActive,
                ]}
                onPress={() => {
                  setInputMode("perShare");
                  setTotalAmount("");
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modeToggleBtnText,
                    inputMode === "perShare" && styles.modeToggleBtnTextActive,
                  ]}
                >
                  Per Share
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeToggleBtn,
                  inputMode === "totalAmount" && styles.modeToggleBtnActive,
                ]}
                onPress={() => {
                  setInputMode("totalAmount");
                  setDividendPerShare("");
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modeToggleBtnText,
                    inputMode === "totalAmount" &&
                      styles.modeToggleBtnTextActive,
                  ]}
                >
                  Total Amount
                </Text>
              </TouchableOpacity>
            </View>

            {/* Shares */}
            <Text style={styles.fieldLabel}>Number of Shares</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              placeholderTextColor={colors.textMuted}
              value={shares}
              onChangeText={setShares}
              keyboardType="decimal-pad"
            />

            {/* Dividend Per Share or Total Amount */}
            {inputMode === "perShare" ? (
              <>
                <Text style={styles.fieldLabel}>Dividend Per Share (PKR)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5.50"
                  placeholderTextColor={colors.textMuted}
                  value={dividendPerShare}
                  onChangeText={setDividendPerShare}
                  keyboardType="decimal-pad"
                />
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>
                  Total Dividend Amount (PKR)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2750"
                  placeholderTextColor={colors.textMuted}
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                  keyboardType="decimal-pad"
                />
                {/* Show calculated per share in totalAmount mode */}
                {sharesNum > 0 &&
                  totalAmountNum > 0 &&
                  !isNaN(sharesNum) &&
                  !isNaN(totalAmountNum) && (
                    <View style={styles.calculatedRow}>
                      <Text style={styles.calculatedLabel}>Per Share:</Text>
                      <Text style={styles.calculatedValue}>
                        PKR{" "}
                        {(totalAmountNum / sharesNum).toLocaleString("en-PK", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </Text>
                    </View>
                  )}
              </>
            )}

            {/* Total Preview */}
            {totalPreview !== null && (
              <View style={styles.totalPreview}>
                <Text style={styles.totalLabel}>Total Dividend</Text>
                <Text style={styles.totalValue}>
                  PKR{" "}
                  {totalPreview.toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}

            {/* Payment Date */}
            <Text style={styles.fieldLabel}>Payment Date</Text>
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Calendar size={18} color={colors.secondary} />
              <Text style={styles.dateText}>
                {paymentDate.toLocaleDateString("en-PK", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </TouchableOpacity>

            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="e.g. Final dividend FY2025"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, disabled && styles.saveBtnDisabled]}
              onPress={onSubmit}
              activeOpacity={0.85}
              disabled={disabled}
            >
              {submitting ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.saveBtnText}>Save Dividend</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>

        <DatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelect={(date) => {
            setPaymentDate(date);
            setShowDatePicker(false);
          }}
          selectedDate={paymentDate}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
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
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 2,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 13,
  },
  symbolRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  symbolInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },
  searchBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnDisabled: { opacity: 0.4 },
  fieldHint: {
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: 2,
  },
  totalPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.secondaryMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.secondary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.secondary,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dateText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textInverse,
  },
  modeToggleContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  modeToggleBtnActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  modeToggleBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  modeToggleBtnTextActive: {
    color: colors.textInverse,
  },
  calculatedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  calculatedLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  calculatedValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
