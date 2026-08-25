import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, fontSize } from "@/src/theme";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseTimeOrNow(value: string): { h: number; m: number } {
  if (value && /^\d{1,2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(":").map(Number);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return { h, m };
  }
  const d = new Date();
  return { h: d.getHours(), m: d.getMinutes() };
}

export function TimePickerField({
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
  const [step, setStep] = useState<"h" | "m">("h");
  const [selH, setSelH] = useState(0);
  const [selM, setSelM] = useState(0);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  const openPicker = () => {
    const init = parseTimeOrNow(value);
    setSelH(init.h);
    setSelM(init.m);
    setStep("h");
    setOpen(true);
  };

  const pickHour = (h: number) => {
    setSelH(h);
    setStep("m");
    Haptics.selectionAsync();
  };

  const pickMinute = (m: number) => {
    setSelM(m);
    Haptics.selectionAsync();
  };

  const confirm = () => {
    onChange(`${pad(selH)}:${pad(selM)}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(false);
  };

  const setNow = () => {
    const d = new Date();
    setSelH(d.getHours());
    setSelM(d.getMinutes());
    setStep("m");
    Haptics.selectionAsync();
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        style={styles.input}
        testID={testID}
      >
        <Feather name="clock" size={16} color={colors.onSurfaceSecondary} />
        <Text
          style={[
            styles.inputText,
            !value && { color: colors.onSurfaceTertiary },
          ]}
          numberOfLines={1}
        >
          {value ? `${value} Uhr` : placeholder ?? "Uhrzeit wählen"}
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
            {/* Live-Preview */}
            <View style={styles.previewRow}>
              <Pressable
                onPress={() => setStep("h")}
                style={[styles.previewCell, step === "h" && styles.previewCellActive]}
                testID="tp-focus-hour"
              >
                <Text style={styles.previewLabel}>Stunde</Text>
                <Text
                  style={[
                    styles.previewValue,
                    step === "h" && { color: colors.brandPrimary },
                  ]}
                >
                  {pad(selH)}
                </Text>
              </Pressable>
              <Text style={styles.previewSep}>:</Text>
              <Pressable
                onPress={() => setStep("m")}
                style={[styles.previewCell, step === "m" && styles.previewCellActive]}
                testID="tp-focus-minute"
              >
                <Text style={styles.previewLabel}>Minute</Text>
                <Text
                  style={[
                    styles.previewValue,
                    step === "m" && { color: colors.brandPrimary },
                  ]}
                >
                  {pad(selM)}
                </Text>
              </Pressable>
            </View>

            {step === "h" ? (
              <>
                <Text style={styles.stepTitle}>Stunde wählen</Text>
                <View style={styles.grid}>
                  {hours.map((h) => {
                    const isSel = h === selH;
                    return (
                      <Pressable
                        key={h}
                        onPress={() => pickHour(h)}
                        style={[styles.gridCell, isSel && styles.gridCellSel]}
                        testID={`tp-hour-${h}`}
                      >
                        <Text
                          style={[
                            styles.gridCellText,
                            isSel && styles.gridCellTextSel,
                          ]}
                        >
                          {pad(h)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.stepTitle}>Minute wählen</Text>
                <ScrollView style={styles.minutesScroll}>
                  <View style={styles.grid}>
                    {minutes.map((m) => {
                      const isSel = m === selM;
                      return (
                        <Pressable
                          key={m}
                          onPress={() => pickMinute(m)}
                          style={[styles.gridCell, isSel && styles.gridCellSel]}
                          testID={`tp-minute-${m}`}
                        >
                          <Text
                            style={[
                              styles.gridCellText,
                              isSel && styles.gridCellTextSel,
                            ]}
                          >
                            {pad(m)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </>
            )}

            <View style={styles.actions}>
              <Pressable onPress={setNow} style={styles.linkBtn} testID="tp-now">
                <Text style={styles.linkBtnText}>Jetzt</Text>
              </Pressable>
              <View style={{ flex: 1 }} />
              {step === "m" ? (
                <Pressable
                  onPress={() => setStep("h")}
                  style={styles.linkBtn}
                  testID="tp-back"
                >
                  <Text style={styles.linkBtnText}>Zurück</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => setOpen(false)}
                style={styles.linkBtn}
                testID="tp-cancel"
              >
                <Text style={styles.linkBtnText}>Abbrechen</Text>
              </Pressable>
              <Pressable
                onPress={confirm}
                style={styles.confirmBtn}
                testID="tp-confirm"
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
    maxHeight: "90%",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  previewCell: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    minWidth: 96,
  },
  previewCellActive: {
    backgroundColor: colors.brandTertiary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandPrimary,
  },
  previewLabel: {
    fontSize: fontSize.sm,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewValue: {
    fontSize: 40,
    fontWeight: "500",
    color: colors.onSurface,
    lineHeight: 48,
  },
  previewSep: {
    fontSize: 40,
    fontWeight: "500",
    color: colors.onSurfaceSecondary,
  },
  stepTitle: {
    fontSize: fontSize.sm,
    color: colors.brandPrimary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridCell: {
    width: `${100 / 6}%`,
    aspectRatio: 1.4,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  gridCellSel: {},
  gridCellText: {
    fontSize: fontSize.lg,
    color: colors.onSurface,
    fontWeight: "500",
    width: 40,
    height: 32,
    lineHeight: 32,
    textAlign: "center",
    borderRadius: radius.sm,
  },
  gridCellTextSel: {
    backgroundColor: colors.brandPrimary,
    color: colors.onBrandPrimary,
    overflow: "hidden",
  },
  minutesScroll: {
    maxHeight: 260,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: "wrap",
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
