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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "../components/ui/Button";
import { useAddTransaction } from "../hooks/usePortfolio";
import type { RootStackParamList } from "../navigation/types";
import { colors, theme, borderRadius, fonts } from "../constants/theme";

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

  const disabled =
    mutation.isPending ||
    !symbol ||
    !quantity ||
    !price ||
    Number(quantity) <= 0;

  const totalAmount = Number(quantity) * Number(price);

  return (
    <SafeAreaView style={theme.screen} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={theme.screen}
          contentContainerStyle={[theme.screenPadding, { paddingTop: 16 }]}
        >
          <View style={{ marginBottom: 24 }}>
            <Text style={[theme.title, { fontSize: 24 }]}>
              {type === "SELL" ? "Sell Stock" : "Buy Stock"}
            </Text>
            <Text style={theme.subtitle}>
              {type === "SELL"
                ? `Record a sale transaction for ${symbol || "your stock"}.`
                : "Record a buy transaction for your PSX portfolio."}
            </Text>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={theme.label}>Stock Symbol</Text>
            <TextInput
              style={[styles.input, hasSymbolParam && styles.inputDisabled]}
              placeholder="e.g. OGDC, LUCK, FFC"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              value={symbol}
              onChangeText={setSymbol}
              editable={!hasSymbolParam}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={theme.label}>Transaction Type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                onPress={() => setType("BUY")}
                style={[styles.typeBtn, type === "BUY" && styles.typeBtnBuy]}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    type === "BUY" && styles.typeBtnTextActive,
                  ]}
                >
                  BUY
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setType("SELL")}
                style={[styles.typeBtn, type === "SELL" && styles.typeBtnSell]}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    type === "SELL" && styles.typeBtnTextActive,
                  ]}
                >
                  SELL
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={theme.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={theme.label}>Price per Share</Text>
              <TextInput
                style={styles.input}
                placeholder="PKR"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {totalAmount > 0 && (
            <View style={styles.totalCard}>
              <Text style={theme.label}>Total Amount</Text>
              <Text style={[theme.valueLarge, { marginTop: 4 }]}>
                PKR {totalAmount.toLocaleString("en-PK")}
              </Text>
            </View>
          )}

          <View style={{ marginBottom: 16 }}>
            <Text style={theme.label}>Transaction Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={date}
              onChangeText={setDate}
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={theme.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Investment thesis, reason for trade, etc."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={{ marginBottom: 40 }}>
            <Button
              title={mutation.isPending ? "Saving..." : "Save Transaction"}
              onPress={onSubmit}
              disabled={disabled}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.sans.regular,
    color: colors.textPrimary,
  },
  row2: {
    flexDirection: "row",
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  typeBtnBuy: {
    backgroundColor: colors.successMuted,
    borderColor: colors.success,
  },
  typeBtnSell: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.danger,
  },
  typeBtnText: {
    fontSize: 16,
    fontFamily: fonts.sans.semibold,
    color: colors.textSecondary,
  },
  typeBtnTextActive: {
    color: colors.textPrimary,
  },
  totalCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputDisabled: {
    backgroundColor: colors.card,
    opacity: 0.7,
  },
});
