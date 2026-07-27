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
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, Search, Calendar } from "lucide-react-native";
import DatePickerModal from "../components/ui/DatePickerModal";
import StockLogo from "../components/shared/StockLogo";
import { useAddDividend } from "../hooks/useDividends";
import { useStock } from "../hooks/useStocks";
import { getStock, type Stock } from "../services/api";
import type { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../constants/theme";

type Route = RouteProp<RootStackParamList, "AddDividend">;
type Nav = NativeStackNavigationProp<RootStackParamList, "AddDividend">;

export default function AddDividendScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const mutation = useAddDividend();

  const initialSymbol = route.params?.symbol ?? "";
  const hasSymbolParam = !!route.params?.symbol;

  const [symbol, setSymbol] = useState(initialSymbol);
  const [manualStock, setManualStock] = useState<Stock | null>(null);
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

  const { data: routeStock } = useStock(hasSymbolParam ? initialSymbol : "");
  const resolvedStock = hasSymbolParam ? (routeStock ?? null) : manualStock;

  const sharesNum = Number(shares);
  const perShareNum = Number(dividendPerShare);
  const totalAmountNum = Number(totalAmount);

  const calculatedDividendPerShare =
    inputMode === "totalAmount"
      ? sharesNum > 0 &&
        totalAmountNum > 0 &&
        !isNaN(sharesNum) &&
        !isNaN(totalAmountNum)
        ? totalAmountNum / sharesNum
        : null
      : perShareNum >= 0 && !isNaN(perShareNum)
        ? perShareNum
        : null;

  // Calculate based on input mode
  const totalPreview =
    inputMode === "totalAmount"
      ? totalAmountNum > 0 && !isNaN(totalAmountNum)
        ? totalAmountNum
        : null
      : sharesNum > 0 && calculatedDividendPerShare != null
        ? sharesNum * calculatedDividendPerShare
        : null;

  const lookupSymbol = async (sym: string) => {
    if (hasSymbolParam || !sym.trim()) return;
    setSymbolLoading(true);
    setSymbolHint("");
    try {
      const stock = await getStock(sym.trim().toUpperCase());
      if (stock) {
        setSymbol(stock.symbol);
        setManualStock(stock);
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

  const clearResolvedSymbol = () => {
    if (hasSymbolParam) return;
    setManualStock(null);
    setSymbol("");
    setSymbolHint("");
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
      const finalDividendPerShare = calculatedDividendPerShare ?? 0;

      const year = paymentDate.getFullYear();
      const month = String(paymentDate.getMonth() + 1).padStart(2, "0");
      const day = String(paymentDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      await mutation.mutateAsync({
        stockSymbol: symbol.trim().toUpperCase(),
        shares: sharesNum,
        dividendPerShare: finalDividendPerShare,
        paymentDate: dateStr,
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
          <Text style={styles.headerTitle}>Add dividend</Text>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Symbol */}
            <Text style={styles.fieldLabel}>Stock symbol</Text>
            {resolvedStock ? (
              <TouchableOpacity
                style={styles.stockChip}
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
              </TouchableOpacity>
            ) : (
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
                  editable={!symbolLoading}
                  returnKeyType="search"
                  onSubmitEditing={() => lookupSymbol(symbol)}
                />
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
              </View>
            )}
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
                  Per share
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
                  Total amount
                </Text>
              </TouchableOpacity>
            </View>

            {/* Shares */}
            <Text style={styles.fieldLabel}>Number of shares</Text>
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
                <Text style={styles.fieldLabel}>Dividend per share (PKR)</Text>
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
                  Total dividend amount (PKR)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2750"
                  placeholderTextColor={colors.textMuted}
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                  keyboardType="decimal-pad"
                />
              </>
            )}

            {/* Reciprocal preview — total payout in per-share mode, per-share in total-amount mode */}
            {inputMode === "perShare"
              ? totalPreview !== null && (
                  <LinearGradient
                    colors={["#0E2320", "#091513"]}
                    style={styles.previewCard}
                  >
                    <View>
                      <Text style={styles.previewLabel}>Total payout</Text>
                      <Text style={styles.previewSub}>
                        {sharesNum} shares × PKR {perShareNum.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.previewValue}>
                      PKR{" "}
                      {totalPreview.toLocaleString("en-PK", {
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </LinearGradient>
                )
              : calculatedDividendPerShare !== null && (
                  <LinearGradient
                    colors={["#0E2320", "#091513"]}
                    style={styles.previewCard}
                  >
                    <View>
                      <Text style={styles.previewLabel}>Per share</Text>
                      <Text style={styles.previewSub}>
                        {sharesNum} shares ÷ PKR{" "}
                        {totalAmountNum.toLocaleString("en-PK", {
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                    <Text style={styles.previewValue}>
                      PKR {calculatedDividendPerShare.toFixed(2)}
                    </Text>
                  </LinearGradient>
                )}

            {/* Payment Date */}
            <Text style={styles.fieldLabel}>Payment date</Text>
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Calendar size={17} color={colors.secondary} />
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
                <Text style={styles.saveBtnText}>Save dividend</Text>
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.12,
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  notesInput: {
    minHeight: 64,
    textAlignVertical: "top",
    paddingTop: 14,
    fontFamily: fonts.sans.medium,
  },
  symbolRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  symbolInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    fontFamily: fonts.sans.semibold,
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },
  searchBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnDisabled: { opacity: 0.4 },
  fieldHint: {
    fontSize: 12,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  stockChip: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.secondaryGlow,
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
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.secondaryGlow,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 14,
  },
  previewLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.12,
  },
  previewSub: {
    fontSize: 11,
    fontFamily: fonts.sans.medium,
    color: colors.textDim,
    marginTop: 3,
  },
  previewValue: {
    fontSize: 22,
    fontFamily: fonts.sans.extrabold,
    color: colors.secondary,
    letterSpacing: -0.02,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  dateText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fonts.sans.bold,
  },
  saveBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontSize: 15,
    fontFamily: fonts.sans.extrabold,
    color: colors.textInverse,
  },
  modeToggleContainer: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
    marginTop: 14,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  modeToggleBtnActive: {
    backgroundColor: colors.secondary,
  },
  modeToggleBtnText: {
    fontSize: 13,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  modeToggleBtnTextActive: {
    color: colors.textInverse,
    fontFamily: fonts.sans.extrabold,
  },
});
