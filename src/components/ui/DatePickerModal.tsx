import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

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

  const canGoNext = !maximumDate || new Date(year, month + 1, 1) <= maximumDate;

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
});
