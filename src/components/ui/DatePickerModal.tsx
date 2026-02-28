import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from "react-native";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { colors } from "../../constants/theme";

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate: Date;
  maximumDate?: Date;
  minimumDate?: Date;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePickerModal({
  visible,
  onClose,
  onSelect,
  selectedDate,
  maximumDate,
  minimumDate,
}: DatePickerModalProps) {
  const [viewDate, setViewDate] = useState(() => new Date(selectedDate));
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Generate year range (past 100 years to future 10 years)
  const currentYear = new Date().getFullYear();
  const yearRange = Array.from(
    { length: 111 },
    (_, i) => currentYear - 100 + i,
  );

  const daysInMonth = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Add empty slots for days before the first day of the month
    const startWeekday = firstDay.getDay();
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [year, month]);

  const isDateDisabled = (date: Date | null): boolean => {
    if (!date) return true;
    if (maximumDate && date > maximumDate) return true;
    if (minimumDate && date < minimumDate) return true;
    return false;
  };

  const isSelected = (date: Date | null): boolean => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleSelectDate = (date: Date) => {
    onSelect(date);
    onClose();
  };

  const goToPreviousMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(year, month + 1, 1);
    if (!maximumDate || nextMonth <= maximumDate) {
      setViewDate(nextMonth);
    }
  };

  const handleSelectYear = (selectedYear: number) => {
    setViewDate(new Date(selectedYear, month, 1));
    setShowYearPicker(false);
  };

  const handleSelectMonth = (selectedMonth: number) => {
    setViewDate(new Date(year, selectedMonth, 1));
    setShowMonthPicker(false);
  };

  const canGoNext = !maximumDate || new Date(year, month + 1, 1) <= maximumDate;

  // Year picker modal
  if (showYearPicker) {
    return (
      <Modal
        visible={visible && showYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Year</Text>
              <TouchableOpacity
                onPress={() => setShowYearPicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={yearRange}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item: yr }) => (
                <TouchableOpacity
                  style={[
                    styles.yearItem,
                    yr === year && styles.yearItemSelected,
                  ]}
                  onPress={() => handleSelectYear(yr)}
                >
                  <Text
                    style={[
                      styles.yearText,
                      yr === year && styles.yearTextSelected,
                    ]}
                  >
                    {yr}
                  </Text>
                </TouchableOpacity>
              )}
              scrollEventThrottle={16}
              initialScrollIndex={Math.max(0, yearRange.indexOf(year) - 5)}
              getItemLayout={(data, index) => ({
                length: 50,
                offset: 50 * index,
                index,
              })}
              style={{ maxHeight: 300 }}
            />
          </View>
        </View>
      </Modal>
    );
  }

  // Month picker modal
  if (showMonthPicker) {
    return (
      <Modal
        visible={visible && showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Month</Text>
              <TouchableOpacity
                onPress={() => setShowMonthPicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.monthGrid}>
              {MONTHS.map((m, idx) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.monthItem,
                    idx === month && styles.monthItemSelected,
                  ]}
                  onPress={() => handleSelectMonth(idx)}
                >
                  <Text
                    style={[
                      styles.monthItemText,
                      idx === month && styles.monthItemTextSelected,
                    ]}
                  >
                    {m.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Main calendar picker
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Date</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Year/Month Selector Row */}
          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => setShowMonthPicker(true)}
            >
              <Text style={styles.selectorBtnText}>{MONTHS[month]}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => setShowYearPicker(true)}
            >
              <Text style={styles.selectorBtnText}>{year}</Text>
            </TouchableOpacity>
          </View>

          {/* Month/Year Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navBtn}>
              <ChevronLeft size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {MONTHS[month]} {year}
            </Text>
            <TouchableOpacity
              onPress={goToNextMonth}
              style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
              disabled={!canGoNext}
            >
              <ChevronRight
                size={24}
                color={canGoNext ? colors.textPrimary : colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.grid}>
            {daysInMonth.map((date, index) => {
              const disabled = isDateDisabled(date);
              const selected = isSelected(date);
              const today = isToday(date);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    selected && styles.dayCellSelected,
                    today && !selected && styles.dayCellToday,
                  ]}
                  onPress={() => date && !disabled && handleSelectDate(date)}
                  disabled={disabled || !date}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      disabled && styles.dayTextDisabled,
                      selected && styles.dayTextSelected,
                      today && !selected && styles.dayTextToday,
                    ]}
                  >
                    {date?.getDate() ?? ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => {
                const today = new Date();
                // Set to midnight UTC for consistent date comparison
                today.setHours(0, 0, 0, 0);
                if (!maximumDate || today <= maximumDate) {
                  handleSelectDate(today);
                }
              }}
            >
              <Text style={styles.quickBtnText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                yesterday.setHours(0, 0, 0, 0);
                handleSelectDate(yesterday);
              }}
            >
              <Text style={styles.quickBtnText}>Yesterday</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 360,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  selectorRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: colors.secondary,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  dayTextDisabled: {
    color: colors.textMuted,
    opacity: 0.4,
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  dayTextToday: {
    color: colors.secondary,
    fontWeight: "700",
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  quickBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  // Year picker styles
  yearItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 4,
  },
  yearItemSelected: {
    backgroundColor: colors.secondary,
  },
  yearText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
    textAlign: "center",
  },
  yearTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  // Month picker styles
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  monthItem: {
    width: `${(100 - 30) / 3}%`,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  monthItemSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  monthItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  monthItemTextSelected: {
    color: "#fff",
  },
});
