import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  Section,
  Field,
  TextField,
  ChipRow,
  SegmentSelect,
} from "@/src/components/form";
import { colors, spacing, radius, fontSize } from "@/src/theme";
import {
  getSettings,
  newMissionId,
  saveMission,
} from "@/src/lib/storage";
import {
  MASSNAHMEN_OPTIONS,
  SYMPTOME_OPTIONS,
  UEBERGABE_OPTIONS,
  type Affected,
  type Gender,
  type Mission,
  type Role,
} from "@/src/types";

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function emptyAffected(): Affected {
  return { name: "", age: "", gender: "unbekannt", role: "Betroffene:r" };
}

function emptyMission(): Mission {
  const now = new Date().toISOString();
  return {
    id: newMissionId(),
    createdAt: now,
    updatedAt: now,
    einsatzDatum: todayIso(),
    einsatzZeit: nowTime(),
    einsatzOrt: "",
    stichwort: "",
    einsatzkraft: "",
    organisation: "",
    einsatzNummer: "",
    betroffene: [emptyAffected()],
    symptome: [],
    symptomeNotiz: "",
    massnahmen: [],
    massnahmenNotiz: "",
    verlauf: "",
    uebergabeAn: "",
    uebergabeNotiz: "",
    eigeneNotizen: "",
    dauerMinuten: "",
  };
}

export default function NeuerEinsatzScreen() {
  const router = useRouter();
  const [m, setM] = useState<Mission>(emptyMission());
  const [toast, setToast] = useState<string | null>(null);

  const resetForm = useCallback(async () => {
    const s = await getSettings();
    const fresh = emptyMission();
    fresh.einsatzkraft = s.einsatzkraft;
    fresh.organisation = s.organisation;
    setM(fresh);
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, [resetForm])
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const set = <K extends keyof Mission>(key: K, value: Mission[K]) =>
    setM((prev) => ({ ...prev, [key]: value }));

  const toggle = (key: "symptome" | "massnahmen", value: string) => {
    setM((prev) => {
      const list = prev[key];
      const next = list.includes(value)
        ? list.filter((x) => x !== value)
        : [...list, value];
      return { ...prev, [key]: next };
    });
  };

  const updateAffected = (i: number, patch: Partial<Affected>) => {
    setM((prev) => {
      const arr = [...prev.betroffene];
      arr[i] = { ...arr[i], ...patch };
      return { ...prev, betroffene: arr };
    });
  };

  const addAffected = () => {
    Haptics.selectionAsync();
    setM((prev) => ({ ...prev, betroffene: [...prev.betroffene, emptyAffected()] }));
  };

  const removeAffected = (i: number) => {
    setM((prev) => ({
      ...prev,
      betroffene: prev.betroffene.filter((_, idx) => idx !== i),
    }));
  };

  const canSave = m.einsatzDatum.trim() !== "" && m.stichwort.trim() !== "";

  const onSave = async () => {
    if (!canSave) {
      setToast("Bitte mindestens Datum und Stichwort ausfüllen.");
      return;
    }
    Keyboard.dismiss();
    const toSave: Mission = { ...m, updatedAt: new Date().toISOString() };
    await saveMission(toSave);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast("Einsatz gespeichert.");
    router.replace(`/einsatz/${toSave.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header} testID="neu-header">
        <Text style={styles.headerTitle}>Neuer Einsatz</Text>
        <Text style={styles.headerSubtitle}>PSNV-B Dokumentation</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          testID="neu-form-scroll"
        >
          <Section title="Einsatzdaten" first>
            <View style={styles.rowSplit}>
              <View style={{ flex: 1 }}>
                <Field label="Datum">
                  <TextField
                    value={m.einsatzDatum}
                    onChangeText={(v) => set("einsatzDatum", v)}
                    placeholder="YYYY-MM-DD"
                    testID="input-datum"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Uhrzeit">
                  <TextField
                    value={m.einsatzZeit}
                    onChangeText={(v) => set("einsatzZeit", v)}
                    placeholder="HH:MM"
                    testID="input-zeit"
                  />
                </Field>
              </View>
            </View>
            <Field label="Einsatzort">
              <TextField
                value={m.einsatzOrt}
                onChangeText={(v) => set("einsatzOrt", v)}
                placeholder="z.B. Musterstraße 1, Musterstadt"
                testID="input-ort"
              />
            </Field>
            <Field label="Stichwort / Ereignisart">
              <TextField
                value={m.stichwort}
                onChangeText={(v) => set("stichwort", v)}
                placeholder="z.B. Todesfall im häuslichen Umfeld"
                testID="input-stichwort"
              />
            </Field>
            <View style={styles.rowSplit}>
              <View style={{ flex: 1 }}>
                <Field label="Einsatz-Nr.">
                  <TextField
                    value={m.einsatzNummer}
                    onChangeText={(v) => set("einsatzNummer", v)}
                    placeholder="optional"
                    testID="input-einsatznr"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Dauer (Min.)">
                  <TextField
                    value={m.dauerMinuten}
                    onChangeText={(v) => set("dauerMinuten", v)}
                    placeholder="z.B. 90"
                    keyboardType="numeric"
                    testID="input-dauer"
                  />
                </Field>
              </View>
            </View>
            <Field label="Einsatzkraft">
              <TextField
                value={m.einsatzkraft}
                onChangeText={(v) => set("einsatzkraft", v)}
                placeholder="Vor- und Nachname"
                testID="input-einsatzkraft"
              />
            </Field>
            <Field label="Organisation">
              <TextField
                value={m.organisation}
                onChangeText={(v) => set("organisation", v)}
                placeholder="z.B. Malteser, ASB, DRK, KIT"
                testID="input-organisation"
              />
            </Field>
          </Section>

          <Section title="Betroffene">
            {m.betroffene.map((b, i) => (
              <View key={i} style={styles.affectedCard} testID={`affected-${i}`}>
                <View style={styles.affectedHeader}>
                  <Text style={styles.affectedTitle}>
                    Betroffene:r {i + 1}
                  </Text>
                  {m.betroffene.length > 1 ? (
                    <Pressable
                      onPress={() => removeAffected(i)}
                      style={styles.iconBtn}
                      testID={`remove-affected-${i}`}
                    >
                      <Feather name="trash-2" size={16} color={colors.error} />
                    </Pressable>
                  ) : null}
                </View>
                <View style={{ gap: spacing.md }}>
                  <Field label="Name / Bezeichnung">
                    <TextField
                      value={b.name}
                      onChangeText={(v) => updateAffected(i, { name: v })}
                      placeholder="Name oder N.N."
                      testID={`input-affected-name-${i}`}
                    />
                  </Field>
                  <View style={styles.rowSplit}>
                    <View style={{ flex: 1 }}>
                      <Field label="Alter">
                        <TextField
                          value={b.age}
                          onChangeText={(v) => updateAffected(i, { age: v })}
                          placeholder="z.B. 45"
                          testID={`input-affected-age-${i}`}
                        />
                      </Field>
                    </View>
                  </View>
                  <Field label="Geschlecht">
                    <SegmentSelect<Gender>
                      value={b.gender}
                      onChange={(v) => updateAffected(i, { gender: v })}
                      options={["weiblich", "männlich", "divers", "unbekannt"]}
                      testIDPrefix={`seg-gender-${i}`}
                    />
                  </Field>
                  <Field label="Rolle">
                    <ChipRow
                      options={[
                        "Betroffene:r",
                        "Angehörige:r",
                        "Zeug:in",
                        "Einsatzkraft",
                        "Andere",
                      ]}
                      selected={[b.role]}
                      onToggle={(v) => updateAffected(i, { role: v as Role })}
                      testIDPrefix={`chip-role-${i}`}
                    />
                  </Field>
                </View>
              </View>
            ))}
            <Pressable
              onPress={addAffected}
              style={styles.addBtn}
              testID="add-affected-btn"
            >
              <Feather name="plus" size={16} color={colors.brandPrimary} />
              <Text style={styles.addBtnText}>Weitere Person hinzufügen</Text>
            </Pressable>
          </Section>

          <Section title="Zustand & Symptome">
            <Field label="Beobachtete Symptome (mehrfach)">
              <ChipRow
                options={SYMPTOME_OPTIONS}
                selected={m.symptome}
                onToggle={(v) => toggle("symptome", v)}
                testIDPrefix="chip-symptom"
              />
            </Field>
            <Field label="Weitere Beobachtungen">
              <TextField
                value={m.symptomeNotiz}
                onChangeText={(v) => set("symptomeNotiz", v)}
                placeholder="Freie Notizen zum Zustand"
                multiline
                testID="input-symptome-notiz"
              />
            </Field>
          </Section>

          <Section title="Maßnahmen">
            <Field label="Durchgeführte Maßnahmen (mehrfach)">
              <ChipRow
                options={MASSNAHMEN_OPTIONS}
                selected={m.massnahmen}
                onToggle={(v) => toggle("massnahmen", v)}
                testIDPrefix="chip-massnahme"
              />
            </Field>
            <Field label="Ergänzung zu den Maßnahmen">
              <TextField
                value={m.massnahmenNotiz}
                onChangeText={(v) => set("massnahmenNotiz", v)}
                placeholder="Details zu Techniken, Interventionen"
                multiline
                testID="input-massnahmen-notiz"
              />
            </Field>
          </Section>

          <Section title="Verlauf">
            <Field label="Einsatzverlauf / Notizen">
              <TextField
                value={m.verlauf}
                onChangeText={(v) => set("verlauf", v)}
                placeholder="Chronologischer Verlauf, Beobachtungen, Reaktionen"
                multiline
                testID="input-verlauf"
              />
            </Field>
          </Section>

          <Section title="Übergabe">
            <Field label="Übergabe an">
              <ChipRow
                options={UEBERGABE_OPTIONS}
                selected={m.uebergabeAn ? [m.uebergabeAn] : []}
                onToggle={(v) =>
                  set("uebergabeAn", m.uebergabeAn === v ? "" : v)
                }
                testIDPrefix="chip-uebergabe"
              />
            </Field>
            <Field label="Notiz zur Übergabe">
              <TextField
                value={m.uebergabeNotiz}
                onChangeText={(v) => set("uebergabeNotiz", v)}
                placeholder="Kontaktdaten, Absprachen, Weiterversorgung"
                multiline
                testID="input-uebergabe-notiz"
              />
            </Field>
          </Section>

          <Section title="Eigene Felder / Freitext">
            <Field label="Zusätzliche Notizen">
              <TextField
                value={m.eigeneNotizen}
                onChangeText={(v) => set("eigeneNotizen", v)}
                placeholder="Alles, was sonst noch dokumentiert werden soll"
                multiline
                testID="input-eigene-notizen"
              />
            </Field>
          </Section>

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>

        <View style={styles.stickyBar}>
          <Pressable
            onPress={onSave}
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && styles.saveBtnDisabled,
              pressed && canSave && { opacity: 0.9 },
            ]}
            testID="save-mission-btn"
          >
            <Feather name="check" size={18} color={colors.onBrandPrimary} />
            <Text style={styles.saveBtnText}>Speichern</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {toast ? (
        <View style={styles.toast} testID="toast">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomColor: colors.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "500",
    color: colors.onSurface,
  },
  headerSubtitle: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  formContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  rowSplit: { flexDirection: "row", gap: spacing.md },
  affectedCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  affectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  affectedTitle: {
    fontSize: fontSize.lg,
    color: colors.onSurface,
    fontWeight: "500",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandPrimary,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  addBtnText: {
    color: colors.brandPrimary,
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  stickyBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopColor: colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  saveBtnDisabled: {
    backgroundColor: colors.surfaceTertiary,
  },
  saveBtnText: {
    color: colors.onBrandPrimary,
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxxl + 20,
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  toastText: {
    color: colors.onSurfaceInverse,
    fontSize: fontSize.base,
    textAlign: "center",
  },
});
