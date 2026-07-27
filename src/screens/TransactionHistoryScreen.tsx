import React, { useState, useMemo, useCallback } from "react";
import {
  SectionList,
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  X,
  Edit3,
  Trash2,
  Calendar,
} from "lucide-react-native";
import DatePickerModal from "../components/ui/DatePickerModal";
import {
  useTransactions,
  useDeleteTransaction,
  useUpdateTransaction,
} from "../hooks/usePortfolio";
import { computeRealizedPnL } from "../utils/portfolio";
import { colors, fonts } from "../constants/theme";
import type { Transaction } from "../services/api";

type FilterType = "all" | "BUY" | "SELL";

function formatSectionDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const TransactionRow = React.memo(function TransactionRow({
  transaction,
  realizedPnl,
  onPress,
}: {
  transaction: Transaction;
  realizedPnl?: number;
  onPress: () => void;
}) {
  const isBuy = transaction.transactionType === "BUY";
  const showPnl = !isBuy && realizedPnl !== undefined;
  const pnlPositive = (realizedPnl ?? 0) >= 0;

  return (
    <TouchableOpacity
      style={styles.txCard}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.txLeft}>
        <View
          style={[
            styles.txIconCircle,
            {
              backgroundColor: isBuy
                ? colors.secondaryMuted
                : colors.dangerMuted,
            },
          ]}
        >
          {isBuy ? (
            <ArrowUpRight size={17} color={colors.secondary} />
          ) : (
            <ArrowDownRight size={17} color={colors.danger} />
          )}
        </View>
        <View style={styles.txMeta}>
          <View style={styles.txTopRow}>
            <Text style={styles.txSymbol}>{transaction.stockSymbol}</Text>
            <View
              style={[
                styles.txTypeBadge,
                {
                  backgroundColor: isBuy
                    ? colors.secondaryMuted
                    : colors.dangerMuted,
                },
              ]}
            >
              <Text
                style={[
                  styles.txTypeBadgeText,
                  { color: isBuy ? colors.secondary : colors.danger },
                ]}
              >
                {transaction.transactionType}
              </Text>
            </View>
          </View>
          <Text style={styles.txDetail}>
            {transaction.quantity} shares @ PKR{" "}
            {transaction.pricePerShare.toFixed(2)}
          </Text>
          {transaction.notes && (
            <Text style={styles.txNotes} numberOfLines={1}>
              {transaction.notes}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txAmount}>
          {transaction.totalAmount.toLocaleString("en-PK", {
            maximumFractionDigits: 0,
          })}
        </Text>
        {showPnl && (
          <Text
            style={[
              styles.txPnl,
              { color: pnlPositive ? colors.success : colors.danger },
            ]}
          >
            {pnlPositive ? "+" : "-"}PKR{" "}
            {Math.abs(realizedPnl ?? 0).toLocaleString("en-PK", {
              maximumFractionDigits: 0,
            })}{" "}
            P/L
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function TransactionHistoryScreen() {
  const navigation = useNavigation();
  const { data: transactions, isLoading } = useTransactions();
  const deleteTransaction = useDeleteTransaction();
  const updateTransaction = useUpdateTransaction();

  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editNotes, setEditNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const openEditModal = useCallback((tx: Transaction) => {
    setEditTx(tx);
    setEditQuantity(String(tx.quantity));
    setEditPrice(String(tx.pricePerShare));
    const parts = tx.transactionDate.split("-");
    setEditDate(
      new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])),
    );
    setEditNotes(tx.notes || "");
    setEditError("");
  }, []);

  const closeEditModal = () => {
    setEditTx(null);
    setShowDatePicker(false);
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!editTx) return;
    const qty = parseFloat(editQuantity) || 0;
    const price = parseFloat(editPrice) || 0;
    if (qty <= 0 || price <= 0) {
      setEditError("Quantity and price must be greater than 0");
      return;
    }

    setEditLoading(true);
    setEditError("");

    try {
      const year = editDate.getFullYear();
      const month = String(editDate.getMonth() + 1).padStart(2, "0");
      const day = String(editDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      await updateTransaction.mutateAsync({
        id: editTx.id,
        quantity: qty,
        pricePerShare: price,
        totalAmount: qty * price,
        transactionDate: dateStr,
        notes: editNotes.trim() || null,
      });
      closeEditModal();
    } catch (error) {
      console.error("Error saving transaction:", error);
      setEditError("Failed to save changes. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editTx) return;
    setEditLoading(true);
    setEditError("");

    try {
      await deleteTransaction.mutateAsync(editTx.id);
      closeEditModal();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setEditError("Failed to delete transaction. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const { txPnL } = useMemo(
    () => computeRealizedPnL(transactions ?? []),
    [transactions],
  );

  const displayTx = useMemo(() => {
    let filtered = transactions ?? [];

    if (filter !== "all") {
      filtered = filtered.filter((tx) => tx.transactionType === filter);
    }

    const q = searchQuery.trim().toUpperCase();
    if (q) {
      filtered = filtered.filter(
        (tx) =>
          tx.stockSymbol.includes(q) ||
          tx.transactionDate.includes(searchQuery) ||
          tx.notes?.toUpperCase().includes(q),
      );
    }

    return filtered;
  }, [transactions, filter, searchQuery]);

  const sections = useMemo(() => {
    const groups: { title: string; data: Transaction[] }[] = [];
    for (const tx of displayTx) {
      const last = groups[groups.length - 1];
      if (last && last.title === tx.transactionDate) {
        last.data.push(tx);
      } else {
        groups.push({ title: tx.transactionDate, data: [tx] });
      }
    }
    return groups;
  }, [displayTx]);

  const renderTransaction: ListRenderItem<Transaction> = useCallback(
    ({ item }) => (
      <TransactionRow
        transaction={item}
        realizedPnl={txPnL[item.id]}
        onPress={() => openEditModal(item)}
      />
    ),
    [openEditModal, txPnL],
  );

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  const emptyComponent = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No transactions</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? "No matching transactions found"
            : filter !== "all"
              ? `No ${filter === "BUY" ? "buy" : "sell"} transactions found`
              : "Add your first transaction from a stock page"}
        </Text>
      </View>
    ),
    [searchQuery, filter],
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by symbol, date, or notes..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        {(["all", "BUY", "SELL"] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "all" ? "All" : f === "BUY" ? "Bought" : "Sold"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={sections}
        renderItem={renderTransaction}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>
            {formatSectionDate(section.title)}
          </Text>
        )}
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyComponent}
        ItemSeparatorComponent={({ trailingItem }) =>
          trailingItem ? <View style={styles.rowDivider} /> : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        stickySectionHeadersEnabled={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
      />

      <Modal
        visible={!!editTx}
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
              <Text style={styles.modalTitle}>Edit Transaction</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editTx && (
              <ScrollView
                style={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.modalSymbolRow}>
                  <Text style={styles.modalSymbol}>{editTx.stockSymbol}</Text>
                  <View
                    style={[
                      styles.txTypeBadge,
                      {
                        backgroundColor:
                          editTx.transactionType === "BUY"
                            ? colors.secondaryMuted
                            : colors.dangerMuted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.txTypeBadgeText,
                        {
                          color:
                            editTx.transactionType === "BUY"
                              ? colors.secondary
                              : colors.danger,
                        },
                      ]}
                    >
                      {editTx.transactionType}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalFieldRow}>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Quantity</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editQuantity}
                      onChangeText={setEditQuantity}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Price per Share</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editPrice}
                      onChangeText={setEditPrice}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Date</Text>
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

                <View style={styles.modalTotal}>
                  <Text style={styles.modalTotalLabel}>Total</Text>
                  <Text style={styles.modalTotalValue}>
                    PKR{" "}
                    {(
                      (parseFloat(editQuantity) || 0) *
                      (parseFloat(editPrice) || 0)
                    ).toLocaleString("en-PK", { maximumFractionDigits: 0 })}
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
                    onPress={handleDelete}
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
                        color={colors.textInverse}
                        size="small"
                      />
                    ) : (
                      <>
                        <Edit3 size={18} color={colors.textInverse} />
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.secondary,
    borderColor: "transparent",
  },
  filterText: { fontSize: 13, fontFamily: fonts.sans.semibold, color: colors.textMuted },
  filterTextActive: { fontFamily: fonts.sans.bold, color: colors.textInverse },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: {
    paddingTop: 60,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontFamily: fonts.sans.bold, color: colors.textPrimary },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
    textAlign: "center",
  },
  txCard: {
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  txLeft: { flex: 1, flexDirection: "row", gap: 12 },
  txIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  txMeta: { flex: 1, gap: 3 },
  txTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  txSymbol: { fontSize: 14, fontFamily: fonts.sans.bold, color: colors.textPrimary },
  txTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txTypeBadgeText: {
    fontSize: 10,
    fontFamily: fonts.sans.extrabold,
    letterSpacing: 0.08,
  },
  txDetail: { fontSize: 12, fontFamily: fonts.sans.medium, color: colors.textMuted },
  txNotes: { fontSize: 11, fontFamily: fonts.sans.medium, color: colors.textMuted, fontStyle: "italic" },
  txRight: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  txAmount: { fontSize: 14, fontFamily: fonts.sans.bold, color: colors.textPrimary },
  txPnl: { fontSize: 11, fontFamily: fonts.sans.semibold },
  sectionHeader: {
    fontSize: 11,
    fontFamily: fonts.sans.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.14,
    paddingTop: 6,
    paddingBottom: 2,
  },
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.sans.medium,
    color: colors.textPrimary,
    padding: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
  },
  modalScrollContent: {
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  modalSymbolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  modalSymbol: {
    fontSize: 20,
    fontFamily: fonts.sans.extrabold,
    color: colors.textPrimary,
  },
  modalFieldRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  modalField: {
    flex: 1,
    gap: 6,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.12,
  },
  modalInput: {
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
  modalNotesInput: {
    minHeight: 60,
    paddingTop: 14,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 10,
  },
  dateBtnText: {
    fontSize: 15,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  datePickerDone: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  datePickerDoneText: {
    fontSize: 15,
    fontFamily: fonts.sans.semibold,
    color: colors.secondary,
  },
  modalTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalTotalLabel: {
    fontSize: 13,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
  },
  modalTotalValue: {
    fontSize: 18,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: colors.dangerMuted,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.3)",
  },
  deleteBtnText: {
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
    color: colors.danger,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnTextDisabled: {
    color: colors.textMuted,
  },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: colors.secondary,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: fonts.sans.bold,
    color: colors.textInverse,
  },
  errorBox: {
    backgroundColor: colors.dangerMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: fonts.sans.medium,
    color: colors.danger,
  },
});
