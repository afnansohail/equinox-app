import React, { useState, useCallback, useMemo } from "react";
import {
  FlatList,
  Text,
  View,
  StyleSheet,
  ListRenderItem,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Plus, X, Edit3, Trash2, Calendar } from "lucide-react-native";

import DividendSummaryCard from "../components/dividends/DividendSummaryCard";
import DividendStockRanking from "../components/dividends/DividendStockRanking";
import { DividendRow } from "../components/dividends/DividendRow";
import Toast from "../components/shared/Toast";
import DatePickerModal from "../components/ui/DatePickerModal";

import {
  useDividends,
  useDeleteDividend,
  useUpdateDividend,
  useScrapedPayouts,
} from "../hooks/useDividends";
import { usePortfolio } from "../hooks/usePortfolio";
import type { RootStackParamList, MainTabParamList } from "../navigation/types";
import { colors, TAB_BAR_HEIGHT } from "../constants/theme";
import type { Dividend } from "../services/api";
import { buildDividendRanking } from "../utils/dividendRanking";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Dividends">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DividendsScreen() {
  const navigation = useNavigation<Nav>();
  const [toastConfig, setToastConfig] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const { data: dividends, refetch: refetchDividends } = useDividends();
  const { data: holdings } = usePortfolio();
  const deleteMutation = useDeleteDividend();
  const updateMutation = useUpdateDividend();

  const holdingSymbols = useMemo(
    () => [
      ...new Set((holdings ?? []).map((h) => h.stockSymbol.toUpperCase())),
    ],
    [holdings],
  );

  // Combine symbols from active holdings AND all dividends (for sold holdings with history)
  const allChartSymbols = useMemo(
    () => [
      ...new Set([
        ...holdingSymbols,
        ...(dividends ?? []).map((d) => d.stockSymbol.toUpperCase()),
      ]),
    ],
    [holdingSymbols, dividends],
  );

  const { data: scrapedPayouts } = useScrapedPayouts(allChartSymbols);

  // Pass all dividends to chart, not just those in active holdings
  const rankingDividends = dividends ?? [];

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchDividends();
      setToastConfig({ type: "success", msg: "Dividends updated" });
    } catch (error: any) {
      console.error("Error refreshing dividends:", error);
      setToastConfig({
        type: "error",
        msg: error?.message || "Could not refresh dividends",
      });
    } finally {
      setRefreshing(false);
    }
  }, [refetchDividends]);

  // Edit state
  const [editDividend, setEditDividend] = useState<Dividend | null>(null);
  const [editShares, setEditShares] = useState("");
  const [editPerShare, setEditPerShare] = useState("");
  const [editTotalAmount, setEditTotalAmount] = useState("");
  const [editInputMode, setEditInputMode] = useState<
    "perShare" | "totalAmount"
  >("perShare");
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editNotes, setEditNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const openEditModal = useCallback((dividend: Dividend) => {
    setEditDividend(dividend);
    setEditShares(String(dividend.shares));
    setEditPerShare(String(dividend.dividendPerShare));
    setEditTotalAmount("");
    setEditInputMode("perShare");
    const parts = dividend.paymentDate.split("-");
    setEditDate(
      new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])),
    );
    setEditNotes(dividend.notes || "");
    setEditError("");
  }, []);

  const closeEditModal = () => {
    setEditDividend(null);
    setShowDatePicker(false);
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!editDividend) return;
    const shares = parseFloat(editShares) || 0;
    const perShare = parseFloat(editPerShare) || 0;
    const totalAmount = parseFloat(editTotalAmount) || 0;

    if (shares <= 0) {
      setEditError("Shares must be greater than 0");
      return;
    }

    let finalPerShare = perShare;
    if (editInputMode === "totalAmount") {
      if (totalAmount <= 0) {
        setEditError("Total amount must be greater than 0");
        return;
      }
      finalPerShare = totalAmount / shares;
    } else {
      if (perShare <= 0) {
        setEditError("Dividend per share must be greater than 0");
        return;
      }
    }

    setEditLoading(true);
    setEditError("");

    try {
      const year = editDate.getFullYear();
      const month = String(editDate.getMonth() + 1).padStart(2, "0");
      const day = String(editDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      await updateMutation.mutateAsync({
        id: editDividend.id,
        updates: {
          shares,
          dividendPerShare: finalPerShare,
          paymentDate: dateStr,
          notes: editNotes.trim() || null,
        },
      });
      closeEditModal();
      setToastConfig({ type: "success", msg: "Dividend record updated" });
    } catch (error: any) {
      console.error("Error updating dividend:", error);
      setEditError(error?.message || "Failed to update dividend");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        setToastConfig({ type: "success", msg: "Dividend record deleted" });
      } catch (error: any) {
        setToastConfig({
          type: "error",
          msg: error?.message || "Could not delete record",
        });
      }
    },
    [deleteMutation],
  );

  const renderDividend: ListRenderItem<Dividend> = useCallback(
    ({ item }) => (
      <DividendRow
        dividend={item}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />
    ),
    [handleDelete, openEditModal],
  );

  const keyExtractor = useCallback((item: Dividend) => item.id, []);

  const totalAmount = useMemo(
    () => (dividends ?? []).reduce((s, d) => s + d.totalAmount, 0),
    [dividends],
  );

  const topPayer = useMemo(() => {
    if (!dividends || dividends.length === 0) return null;
    const totalBySymbol = new Map<string, number>();
    for (const d of dividends) {
      const existing = totalBySymbol.get(d.stockSymbol) || 0;
      totalBySymbol.set(d.stockSymbol, existing + d.totalAmount);
    }
    let top: string | null = null;
    let maxTotal = 0;
    for (const [sym, total] of totalBySymbol) {
      if (total > maxTotal) {
        maxTotal = total;
        top = sym;
      }
    }
    return top;
  }, [dividends]);

  // Build holdingMeta with all symbols: active holdings with their quantity, sold holdings with quantity = 0
  const holdingMetaForRanking = useMemo(() => {
    const holdingMap = new Map<
      string,
      {
        quantity: number;
        currentPrice?: number;
        peRatio?: number | null;
        sector?: string;
      }
    >();

    // Add active holdings with their quantities
    for (const h of holdings ?? []) {
      const sym = h.stockSymbol.toUpperCase();
      holdingMap.set(sym, {
        quantity: h.quantity,
        currentPrice: h.stock?.currentPrice,
        peRatio: h.stock?.peRatio ?? null,
        sector: h.stock?.sector,
      });
    }

    // Add sold holdings (from dividends) with quantity = 0
    for (const d of rankingDividends) {
      const sym = d.stockSymbol.toUpperCase();
      if (!holdingMap.has(sym)) {
        holdingMap.set(sym, {
          quantity: 0,
          currentPrice: d.stockCurrentPrice,
          peRatio: d.stockPeRatio ?? null,
          sector: undefined,
        });
      }
    }

    return Array.from(holdingMap.entries()).map(([symbol, data]) => ({
      symbol,
      ...data,
    }));
  }, [holdings, rankingDividends]);

  const highestScoreSymbol = useMemo(() => {
    const ranked = buildDividendRanking({
      dividends: rankingDividends,
      scrapedPayouts: scrapedPayouts ?? [],
      holdingMeta: holdingMetaForRanking,
    });
    return ranked.find((r) => r.score > 0)?.symbol ?? null;
  }, [rankingDividends, scrapedPayouts, holdingMetaForRanking]);

  const ListHeader = useMemo(
    () => (
      <>
        <DividendSummaryCard
          totalAmount={totalAmount}
          highestScoreSymbol={highestScoreSymbol}
          topPayer={topPayer}
        />

        {(dividends?.length ?? 0) > 0 && (
          <>
            <DividendStockRanking
              dividends={rankingDividends}
              scrapedPayouts={scrapedPayouts ?? []}
              holdingMeta={holdingMetaForRanking}
              selectedSymbol={selectedSymbol}
              onSymbolPress={setSelectedSymbol}
            />

            <Text style={styles.sectionTitle}>
              All Records (
              {selectedSymbol
                ? (dividends ?? []).filter(
                    (d) => d.stockSymbol === selectedSymbol,
                  ).length
                : (dividends?.length ?? 0)}
              )
            </Text>
          </>
        )}
      </>
    ),
    [
      dividends,
      totalAmount,
      topPayer,
      highestScoreSymbol,
      selectedSymbol,
      rankingDividends,
      scrapedPayouts,
      holdings,
    ],
  );

  const EmptyList = useMemo(
    () => (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No dividends yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap + to record your first dividend payment
        </Text>
      </View>
    ),
    [],
  );

  const filteredDividends = useMemo(() => {
    if (!selectedSymbol) return dividends ?? [];
    return (dividends ?? []).filter((d) => d.stockSymbol === selectedSymbol);
  }, [dividends, selectedSymbol]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dividends</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("AddDividend", {})}
        >
          <Plus size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredDividends}
        renderItem={renderDividend}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: TAB_BAR_HEIGHT + 48 },
        ]}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary}
          />
        }
      />

      <Toast config={toastConfig} onClose={() => setToastConfig(null)} />

      <Modal
        visible={!!editDividend}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Dividend</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editDividend && (
              <ScrollView
                style={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.modalSymbolRow}>
                  <Text style={styles.modalSymbol}>
                    {editDividend.stockSymbol}
                  </Text>
                </View>

                {/* Input Mode Toggle */}
                <View style={styles.modeToggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.modeToggleBtn,
                      editInputMode === "perShare" &&
                        styles.modeToggleBtnActive,
                    ]}
                    onPress={() => {
                      setEditInputMode("perShare");
                      setEditTotalAmount("");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modeToggleBtnText,
                        editInputMode === "perShare" &&
                          styles.modeToggleBtnTextActive,
                      ]}
                    >
                      Per Share
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modeToggleBtn,
                      editInputMode === "totalAmount" &&
                        styles.modeToggleBtnActive,
                    ]}
                    onPress={() => {
                      setEditInputMode("totalAmount");
                      setEditPerShare("");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modeToggleBtnText,
                        editInputMode === "totalAmount" &&
                          styles.modeToggleBtnTextActive,
                      ]}
                    >
                      Total Amount
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalFieldRow}>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Shares</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editShares}
                      onChangeText={setEditShares}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  {editInputMode === "perShare" ? (
                    <View style={styles.modalField}>
                      <Text style={styles.modalLabel}>Amount per Share</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editPerShare}
                        onChangeText={setEditPerShare}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  ) : (
                    <View style={styles.modalField}>
                      <Text style={styles.modalLabel}>Total Amount</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editTotalAmount}
                        onChangeText={setEditTotalAmount}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  )}
                </View>

                {/* Show calculated per share in totalAmount mode */}
                {editInputMode === "totalAmount" &&
                  parseFloat(editShares) > 0 &&
                  parseFloat(editTotalAmount) > 0 && (
                    <View style={styles.calculatedRow}>
                      <Text style={styles.calculatedLabel}>Per Share:</Text>
                      <Text style={styles.calculatedValue}>
                        PKR{" "}
                        {(
                          parseFloat(editTotalAmount) / parseFloat(editShares)
                        ).toLocaleString("en-PK", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </Text>
                    </View>
                  )}

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Payment Date</Text>
                  <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar size={18} color={colors.textSecondary} />
                    <Text style={styles.dateBtnText}>
                      {editDate.toLocaleDateString("en-PK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Notes (optional)</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalNotesInput]}
                    value={editNotes}
                    onChangeText={setEditNotes}
                    placeholder="Add notes..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>
            )}

            {editDividend && (
              <View style={styles.modalBottom}>
                <View style={styles.modalTotal}>
                  <Text style={styles.modalTotalLabel}>Total</Text>
                  <Text style={styles.modalTotalValue}>
                    PKR{" "}
                    {(editInputMode === "perShare"
                      ? (parseFloat(editShares) || 0) *
                        (parseFloat(editPerShare) || 0)
                      : parseFloat(editTotalAmount) || 0
                    ).toLocaleString("en-PK", { maximumFractionDigits: 2 })}
                  </Text>
                </View>

                {!!editError && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{editError}</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.deleteBtn,
                      editLoading && styles.btnDisabled,
                    ]}
                    onPress={() => {
                      if (editDividend) {
                        closeEditModal();
                        handleDelete(editDividend.id);
                      }
                    }}
                    disabled={editLoading}
                  >
                    <Trash2
                      size={18}
                      color={editLoading ? colors.textMuted : colors.danger}
                    />
                    <Text
                      style={[
                        styles.deleteBtnText,
                        editLoading && styles.btnTextDisabled,
                      ]}
                    >
                      Delete
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, editLoading && styles.btnDisabled]}
                    onPress={handleSaveEdit}
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <ActivityIndicator
                        color={colors.background}
                        size="small"
                      />
                    ) : (
                      <>
                        <Edit3 size={18} color={colors.background} />
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date) => setEditDate(date)}
        selectedDate={editDate}
        maximumDate={new Date()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexShrink: 1,
  },
  modalBottom: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalSymbolRow: {
    marginBottom: 16,
  },
  modalSymbol: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalFieldRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  modalField: {
    flex: 1,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  modalInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.textPrimary,
    fontSize: 14,
  },
  modalNotesInput: { minHeight: 80 },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    gap: 8,
  },
  dateBtnText: { color: colors.textPrimary, fontSize: 14 },
  modalTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalTotalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  modalTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  errorBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: colors.danger },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 8,
    gap: 6,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "600", color: colors.danger },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    gap: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.background,
  },
  btnDisabled: { opacity: 0.5 },
  btnTextDisabled: { color: colors.textMuted },
  modeToggleContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
