import React, { useState, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
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
import { colors } from "../constants/theme";
import type { Transaction } from "../services/api";

type FilterType = "all" | "BUY" | "SELL";

export default function TransactionHistoryScreen() {
  const navigation = useNavigation();
  const { data: transactions, isLoading } = useTransactions();
  const deleteTransaction = useDeleteTransaction();
  const updateTransaction = useUpdateTransaction();

  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  // Edit modal state
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editNotes, setEditNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const openEditModal = (tx: Transaction) => {
    setEditTx(tx);
    setEditQuantity(String(tx.quantity));
    setEditPrice(String(tx.pricePerShare));
    setEditDate(new Date(tx.transactionDate));
    setEditNotes(tx.notes || "");
  };

  const closeEditModal = () => {
    setEditTx(null);
    setShowDatePicker(false);
  };

  const handleSaveEdit = async () => {
    if (!editTx) return;
    const qty = parseFloat(editQuantity) || 0;
    const price = parseFloat(editPrice) || 0;
    if (qty <= 0 || price <= 0) return;

    await updateTransaction.mutateAsync({
      id: editTx.id,
      quantity: qty,
      pricePerShare: price,
      totalAmount: qty * price,
      transactionDate: editDate.toISOString().slice(0, 10),
      notes: editNotes.trim() || null,
    });
    closeEditModal();
  };

  const handleDelete = async () => {
    if (!editTx) return;
    await deleteTransaction.mutateAsync(editTx.id);
    closeEditModal();
  };

  const displayTx = useMemo(() => {
    let filtered = transactions ?? [];

    // Filter by type
    if (filter !== "all") {
      filtered = filtered.filter((tx) => tx.transactionType === filter);
    }

    // Filter by search query
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

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
      </View>

      {/* Search Bar */}
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

      {/* Filter Pills */}
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
              {f === "all" ? "All" : f === "BUY" ? "Buys" : "Sells"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {displayTx.length === 0 ? (
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
        ) : (
          displayTx.map((tx) => {
            const isBuy = tx.transactionType === "BUY";
            return (
              <TouchableOpacity
                key={tx.id}
                style={styles.txCard}
                activeOpacity={0.7}
                onPress={() => openEditModal(tx)}
              >
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.txIconCircle,
                      {
                        backgroundColor: isBuy
                          ? "rgba(34,197,94,0.12)"
                          : "rgba(239,68,68,0.12)",
                      },
                    ]}
                  >
                    {isBuy ? (
                      <ArrowUpRight size={18} color="#22C55E" />
                    ) : (
                      <ArrowDownRight size={18} color={colors.danger} />
                    )}
                  </View>
                  <View style={styles.txMeta}>
                    <View style={styles.txTopRow}>
                      <Text style={styles.txSymbol}>{tx.stockSymbol}</Text>
                      <View
                        style={[
                          styles.txTypeBadge,
                          {
                            backgroundColor: isBuy
                              ? "rgba(34,197,94,0.12)"
                              : "rgba(239,68,68,0.12)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.txTypeBadgeText,
                            { color: isBuy ? "#22C55E" : colors.danger },
                          ]}
                        >
                          {tx.transactionType}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.txDetail}>
                      {tx.quantity} shares @ PKR {tx.pricePerShare.toFixed(2)}
                    </Text>
                    <Text style={styles.txDate}>{tx.transactionDate}</Text>
                    {tx.notes && (
                      <Text style={styles.txNotes} numberOfLines={1}>
                        {tx.notes}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txAmount}>
                    PKR{" "}
                    {tx.totalAmount.toLocaleString("en-PK", {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.txStatus,
                      { color: isBuy ? colors.danger : "#22C55E" },
                    ]}
                  >
                    {isBuy ? "Debited" : "Credited"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Edit Transaction Modal */}
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
                            ? "rgba(34,197,94,0.12)"
                            : "rgba(239,68,68,0.12)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.txTypeBadgeText,
                        {
                          color:
                            editTx.transactionType === "BUY"
                              ? "#22C55E"
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

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDelete}
                  >
                    <Trash2 size={18} color={colors.danger} />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveEdit}
                  >
                    <Edit3 size={18} color={colors.background} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Date Picker */}
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
    backgroundColor: colors.textPrimary,
    borderColor: "transparent",
  },
  filterText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  filterTextActive: { color: colors.textInverse },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  empty: {
    paddingTop: 60,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  txCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
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
  txSymbol: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  txTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txTypeBadgeText: { fontSize: 11, fontWeight: "700" },
  txDetail: { fontSize: 13, color: colors.textSecondary },
  txDate: { fontSize: 12, color: colors.textMuted },
  txNotes: { fontSize: 12, color: colors.textMuted, fontStyle: "italic" },
  txRight: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  txAmount: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  txStatus: { fontSize: 12, fontWeight: "500" },

  // Search bar
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
  },

  // Edit modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
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
    fontWeight: "700",
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
    fontWeight: "800",
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
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  modalNotesInput: {
    minHeight: 60,
    paddingTop: 12,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  dateBtnText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  datePickerDone: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  datePickerDoneText: {
    fontSize: 15,
    fontWeight: "600",
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
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modalTotalValue: {
    fontSize: 18,
    fontWeight: "700",
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
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.danger,
  },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.secondary,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.background,
  },
});
