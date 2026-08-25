import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, fontSize } from "@/src/theme";

const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseDateOrToday(value: string): {
  year: number;
  month: number;
  day: number;
} {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    if (y > 0 && m > 0 && d > 0) return { year: y, month: m - 1, day: d };
  }
  const t = new Date();
  return { year: t.getFullYear(), month: t.getMonth(), day: t.getDate() };
}

function formatDeDate(iso: string) {
  if (!iso) return "";
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function DatePickerField({
  value,
  onChange,
  placeholder,
  testID,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  testID?: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selYear, setSelYear] = useState(0);
  const [selMonth, setSelMonth] = useState(0);
  const [selDay, setSelDay] = useState(0);

  const openPicker = () => {
    const init = parseDateOrToday(value);
    setViewYear(init.year);
    setViewMonth(init.month);
    setSelYear(init.year);
    setSelMonth(init.month);
    setSelDay(init.day);
    setOpen(true);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const startOffset = (firstDay + 6) % 7; // Mo=0

  const cells = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [startOffset, daysInMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    Haptics.selectionAsync();
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    Haptics.selectionAsync();
  };

  const today = new Date();
  const isToday = (d: number) =>
    d === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();
  const isSel = (d: number) =>
    d === selDay && viewMonth === selMonth && viewYear === selYear;

  const setToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setSelYear(t.getFullYear());
    setSelMonth(t.getMonth());
    setSelDay(t.getDate());
    Haptics.selectionAsync();
  };

  const confirm = () => {
    if (selDay > 0) {
      onChange(`${selYear}-${pad(selMonth + 1)}-${pad(selDay)}`);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        style={styles.input}
        testID={testID}
      >
        <Feather name="calendar" size={16} color={colors.onSurfaceSecondary} />
        <Text
          style={[
            styles.inputText,
            !value && { color: colors.onSurfaceTertiary },
          ]}
          numberOfLines={1}
        >
          {value ? formatDeDate(value) : placeholder ?? "Datum wählen"}
        </Text>
        <Feather
          name="chevron-down"
          size={16}
          color={colors.onSurfaceTertiary}
        />
      </Pressable>

      <Modal
        visible={open}
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={prevMonth}
                style={styles.navBtn}
                testID="dp-prev-month"
                hitSlop={8}
              >
                <Feather
                  name="chevron-left"
                  size={22}
                  color={colors.onSurface}
                />
              </Pressable>
              <Text style={styles.headerText}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <Pressable
                onPress={nextMonth}
                style={styles.navBtn}
                testID="dp-next-month"
                hitSlop={8}
              >
                <Feather
                  name="chevron-right"
                  size={22}
                  color={colors.onSurface}
                />
              </Pressable>
            </View>

            <View style={styles.weekdays}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.weekday}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((d, i) => (
                <View key={i} style={styles.cellWrap}>
                  {d !== null ? (
                    <Pressable
                      onPress={() => {
                        setSelDay(d);
                        setSelMonth(viewMonth);
                        setSelYear(viewYear);
                        Haptics.selectionAsync();
                      }}
                      style={[styles.dayBtn, isSel(d) && styles.dayBtnSel]}
                      testID={`dp-day-${d}`}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSel(d) && styles.dayTextSel,
                          !isSel(d) &&
                            isToday(d) && {
                              color: colors.brandPrimary,
                              fontWeight: "600",
                            },
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={setToday}
                style={styles.linkBtn}
                testID="dp-today"
              >
                <Text style={styles.linkBtnText}>Heute</Text>
              </Pressable>
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={() => setOpen(false)}
                style={styles.linkBtn}
                testID="dp-cancel"
              >
                <Text style={styles.linkBtnText}>Abbrechen</Text>
              </Pressable>
              <Pressable
                onPress={confirm}
                style={styles.confirmBtn}
                testID="dp-confirm"
              >
                <Text style={styles.confirmBtnText}>Übernehmen</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 46,
  },
  inputText: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.onSurface,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: fontSize.lg,
    color: colors.onSurface,
    fontWeight: "500",
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  weekdays: {
    flexDirection: "row",
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSize.sm,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cellWrap: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  dayBtn: {
    flex: 1,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBtnSel: {
    backgroundColor: colors.brandPrimary,
  },
  dayText: {
    fontSize: fontSize.base,
    color: colors.onSurface,
  },
  dayTextSel: {
    color: colors.onBrandPrimary,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  linkBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkBtnText: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
  },
  confirmBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
  },
  confirmBtnText: {
    fontSize: fontSize.base,
    color: colors.onBrandPrimary,
    fontWeight: "600",
  },
});
