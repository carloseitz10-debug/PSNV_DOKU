import { useEffect, useMemo, useState } from "react";
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
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  Section,
  Field,
  TextField,
  SegmentSelect,
} from "@/src/components/form";
import { colors, spacing, radius, fontSize } from "@/src/theme";
import {
  EINSATZKRAEFTE_VOR_ORT_OPTIONS,
  MASSNAHMEN_OPTIONS,
  NACHFORDERUNG_OPTIONS,
  ORGANISATION_DEFAULT_OPTIONS,
  SETTING_OPTIONS,
  STICHWORT_DEFAULT_OPTIONS,
  UEBERGABE_OPTIONS,
  type Affected,
  type Gender,
  type Mission,
  type Role,
  type Settings,
} from "@/src/types";
import {
  addCustomOrganisation,
  addCustomStichwort,
  getSettings,
} from "@/src/lib/storage";
import { computeDurationMinutes, formatDuration } from "@/src/lib/duration";

function emptyAffected(): Affected {
  return { name: "", age: "", gender: "unbekannt", role: "Betroffene:r" };
}

// Vertical checkbox list – multi-select
function CheckList({
  options,
  selected,
  onToggle,
  testIDPrefix,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  testIDPrefix?: string;
}) {
  return (
    <View style={styles.checkList}>
      {options.map((opt) => {
        const isSel = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => onToggle(opt)}
            style={styles.checkRow}
            testID={testIDPrefix ? `${testIDPrefix}-${opt}` : undefined}
          >
            <View style={[styles.checkbox, isSel && styles.checkboxSelected]}>
              {isSel ? (
                <Feather name="check" size={14} color={colors.onBrandPrimary} />
              ) : null}
            </View>
            <Text style={styles.checkText}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Vertical radio list – single-select
function RadioList({
  options,
  selected,
  onChange,
  testIDPrefix,
}: {
  options: string[];
  selected: string;
  onChange: (v: string) => void;
  testIDPrefix?: string;
}) {
  return (
    <View style={styles.checkList}>
      {options.map((opt) => {
        const isSel = selected === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={styles.checkRow}
            testID={testIDPrefix ? `${testIDPrefix}-${opt}` : undefined}
          >
            <View style={[styles.radio, isSel && styles.radioSelected]}>
              {isSel ? <View style={styles.radioDot} /> : null}
            </View>
            <Text style={styles.checkText}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Horizontal chip row (for compact multi-selects like Rolle, Übergabe)
function ChipRowInline({
  options,
  selected,
  onToggle,
  testIDPrefix,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  testIDPrefix?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {options.map((opt) => {
        const isSel = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => onToggle(opt)}
            style={[styles.chip, isSel && styles.chipSelected]}
            testID={testIDPrefix ? `${testIDPrefix}-${opt}` : undefined}
          >
            <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function MissionForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: Mission;
  submitLabel: string;
  onSubmit: (m: Mission) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [m, setM] = useState<Mission>(initial);
  const [settings, setSettings] = useState<Settings>({
    einsatzkraft: "",
    organisation: "",
    customStichworte: [],
    customOrganisationen: [],
  });
  const [orgWeitereInput, setOrgWeitereInput] = useState("");
  const [stichwortInput, setStichwortInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setM(initial);
  }, [initial]);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const stichwortOptions = useMemo(
    () => [...STICHWORT_DEFAULT_OPTIONS, ...settings.customStichworte],
    [settings.customStichworte],
  );
  const orgOptions = useMemo(
    () => [...ORGANISATION_DEFAULT_OPTIONS, ...settings.customOrganisationen],
    [settings.customOrganisationen],
  );

  const dauerMin = useMemo(
    () =>
      computeDurationMinutes(
        m.alarmierungDatum,
        m.alarmierungZeit,
        m.einsatzendeDatum,
        m.einsatzendeZeit,
      ),
    [
      m.alarmierungDatum,
      m.alarmierungZeit,
      m.einsatzendeDatum,
      m.einsatzendeZeit,
    ],
  );

  const set = <K extends keyof Mission>(key: K, value: Mission[K]) =>
    setM((prev) => ({ ...prev, [key]: value }));

  const toggleMulti = (
    key:
      | "stichworte"
      | "einsatzkraefteVorOrt"
      | "nachforderungen"
      | "setting"
      | "massnahmen",
    value: string,
  ) => {
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

  const addStichwortSonstiges = async () => {
    const val = stichwortInput.trim();
    if (!val) return;
    Keyboard.dismiss();
    const next = await addCustomStichwort(val);
    setSettings(next);
    // auto-select this custom option
    setM((prev) =>
      prev.stichworte.includes(val)
        ? prev
        : { ...prev, stichworte: [...prev.stichworte, val] },
    );
    setStichwortInput("");
    Haptics.selectionAsync();
  };

  const addOrgWeitere = async () => {
    const val = orgWeitereInput.trim();
    if (!val) return;
    Keyboard.dismiss();
    const next = await addCustomOrganisation(val);
    setSettings(next);
    setM((prev) => ({ ...prev, organisation: val }));
    setOrgWeitereInput("");
    Haptics.selectionAsync();
  };

  const canSave = m.alarmierungDatum.trim() !== "" && m.stichworte.length > 0;

  const onSave = async () => {
    if (!canSave) {
      setToast("Bitte Alarmierungs-Datum und mindestens ein Stichwort auswählen.");
      return;
    }
    Keyboard.dismiss();
    await onSubmit({ ...m, dauerMinuten: dauerMin });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        testID="mission-form-scroll"
      >
        {/* EINSATZDATEN */}
        <Section title="Einsatzdaten" first>
          <View style={styles.timeBlock}>
            <Text style={styles.timeBlockLabel}>Alarmierung</Text>
            <View style={styles.rowSplit}>
              <View style={{ flex: 1 }}>
                <Field label="Datum">
                  <TextField
                    value={m.alarmierungDatum}
                    onChangeText={(v) => set("alarmierungDatum", v)}
                    placeholder="YYYY-MM-DD"
                    testID="input-alarmierung-datum"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Uhrzeit">
                  <TextField
                    value={m.alarmierungZeit}
                    onChangeText={(v) => set("alarmierungZeit", v)}
                    placeholder="HH:MM"
                    testID="input-alarmierung-zeit"
                  />
                </Field>
              </View>
            </View>
          </View>

          <View style={styles.timeBlock}>
            <Text style={styles.timeBlockLabel}>Eintreffen</Text>
            <View style={styles.rowSplit}>
              <View style={{ flex: 1 }}>
                <Field label="Datum">
                  <TextField
                    value={m.eintreffenDatum}
                    onChangeText={(v) => set("eintreffenDatum", v)}
                    placeholder="YYYY-MM-DD"
                    testID="input-eintreffen-datum"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Uhrzeit">
                  <TextField
                    value={m.eintreffenZeit}
                    onChangeText={(v) => set("eintreffenZeit", v)}
                    placeholder="HH:MM"
                    testID="input-eintreffen-zeit"
                  />
                </Field>
              </View>
            </View>
          </View>

          <View style={styles.timeBlock}>
            <Text style={styles.timeBlockLabel}>Einsatzende</Text>
            <View style={styles.rowSplit}>
              <View style={{ flex: 1 }}>
                <Field label="Datum">
                  <TextField
                    value={m.einsatzendeDatum}
                    onChangeText={(v) => set("einsatzendeDatum", v)}
                    placeholder="YYYY-MM-DD"
                    testID="input-einsatzende-datum"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Uhrzeit">
                  <TextField
                    value={m.einsatzendeZeit}
                    onChangeText={(v) => set("einsatzendeZeit", v)}
                    placeholder="HH:MM"
                    testID="input-einsatzende-zeit"
                  />
                </Field>
              </View>
            </View>
          </View>

          <View style={styles.durationRow} testID="duration-display">
            <View style={styles.durationIconWrap}>
              <Feather name="clock" size={16} color={colors.brandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.durationLabel}>Dauer (automatisch)</Text>
              <Text style={styles.durationValue}>{formatDuration(dauerMin)}</Text>
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

          <Field label="Stichwort / Ereignisart (mehrfach)">
            <CheckList
              options={stichwortOptions}
              selected={m.stichworte}
              onToggle={(v) => toggleMulti("stichworte", v)}
              testIDPrefix="check-stichwort"
            />
          </Field>

          <View style={styles.addRow}>
            <View style={{ flex: 1 }}>
              <Field label="Sonstiges (wird zur Auswahl hinzugefügt)">
                <TextField
                  value={stichwortInput}
                  onChangeText={setStichwortInput}
                  placeholder="Eigenes Stichwort eintragen"
                  testID="input-stichwort-sonstiges"
                />
              </Field>
            </View>
            <Pressable
              onPress={addStichwortSonstiges}
              style={[
                styles.addInlineBtn,
                !stichwortInput.trim() && styles.addInlineBtnDisabled,
              ]}
              disabled={!stichwortInput.trim()}
              testID="add-stichwort-btn"
            >
              <Feather name="plus" size={18} color={colors.onBrandPrimary} />
            </Pressable>
          </View>

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
          </View>

          <Field label="Einsatzkraft">
            <TextField
              value={m.einsatzkraft}
              onChangeText={(v) => set("einsatzkraft", v)}
              placeholder="Vor- und Nachname"
              testID="input-einsatzkraft"
            />
          </Field>

          <Field label="Organisation (Einzelauswahl)">
            <RadioList
              options={orgOptions}
              selected={m.organisation}
              onChange={(v) => set("organisation", v)}
              testIDPrefix="radio-organisation"
            />
          </Field>

          <View style={styles.addRow}>
            <View style={{ flex: 1 }}>
              <Field label="weitere (wird zur Auswahl hinzugefügt)">
                <TextField
                  value={orgWeitereInput}
                  onChangeText={setOrgWeitereInput}
                  placeholder="Andere Organisation eintragen"
                  testID="input-org-weitere"
                />
              </Field>
            </View>
            <Pressable
              onPress={addOrgWeitere}
              style={[
                styles.addInlineBtn,
                !orgWeitereInput.trim() && styles.addInlineBtnDisabled,
              ]}
              disabled={!orgWeitereInput.trim()}
              testID="add-org-btn"
            >
              <Feather name="plus" size={18} color={colors.onBrandPrimary} />
            </Pressable>
          </View>
        </Section>

        {/* BETROFFENE */}
        <Section title="Betroffene">
          {m.betroffene.map((b, i) => (
            <View key={i} style={styles.affectedCard} testID={`affected-${i}`}>
              <View style={styles.affectedHeader}>
                <Text style={styles.affectedTitle}>Betroffene:r {i + 1}</Text>
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
                  <ChipRowInline
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

        {/* SITUATION AN DER EINSATZSTELLE */}
        <Section title="Situation an der Einsatzstelle">
          <Field label="Einsatzkräfte vor Ort (mehrfach)">
            <CheckList
              options={EINSATZKRAEFTE_VOR_ORT_OPTIONS}
              selected={m.einsatzkraefteVorOrt}
              onToggle={(v) => toggleMulti("einsatzkraefteVorOrt", v)}
              testIDPrefix="check-einsatzkraft-vor-ort"
            />
          </Field>

          <Field label="Nachforderung (mehrfach)">
            <CheckList
              options={NACHFORDERUNG_OPTIONS}
              selected={m.nachforderungen}
              onToggle={(v) => toggleMulti("nachforderungen", v)}
              testIDPrefix="check-nachforderung"
            />
          </Field>

          <Field label="Andere Nachforderungen (Freitext)">
            <TextField
              value={m.nachforderungenSonstiges}
              onChangeText={(v) => set("nachforderungenSonstiges", v)}
              placeholder="z.B. Feuerwehr, Bestatter, Dolmetscher …"
              testID="input-nachforderung-sonstiges"
            />
          </Field>
        </Section>

        {/* SETTING */}
        <Section title="Setting">
          <Field label="Setting">
            <CheckList
              options={SETTING_OPTIONS}
              selected={m.setting}
              onToggle={(v) => toggleMulti("setting", v)}
              testIDPrefix="check-setting"
            />
          </Field>
          <Field label="Notiz zum Setting">
            <TextField
              value={m.settingNotiz}
              onChangeText={(v) => set("settingNotiz", v)}
              placeholder="Freitext zum Setting"
              multiline
              testID="input-setting-notiz"
            />
          </Field>
          <Field label="Weitere Beobachtungen">
            <TextField
              value={m.weitereBeobachtungen}
              onChangeText={(v) => set("weitereBeobachtungen", v)}
              placeholder="Beobachtungen zur Situation, Reaktionen, Kontext"
              multiline
              testID="input-weitere-beobachtungen"
            />
          </Field>
        </Section>

        {/* MASSNAHMEN */}
        <Section title="Maßnahmen">
          <Field label="Durchgeführte Maßnahmen (mehrfach)">
            <CheckList
              options={MASSNAHMEN_OPTIONS}
              selected={m.massnahmen}
              onToggle={(v) => toggleMulti("massnahmen", v)}
              testIDPrefix="check-massnahme"
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

        {/* VERLAUF */}
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

        {/* ÜBERGABE */}
        <Section title="Übergabe">
          <Field label="Übergabe an">
            <ChipRowInline
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

        {/* EIGENE NOTIZEN */}
        <Section title="Eigene Notizen">
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
        {onCancel ? (
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && { opacity: 0.85 },
            ]}
            testID="cancel-mission-btn"
          >
            <Text style={styles.cancelBtnText}>Abbrechen</Text>
          </Pressable>
        ) : null}
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
          <Text style={styles.saveBtnText}>{submitLabel}</Text>
        </Pressable>
      </View>

      {toast ? (
        <View style={styles.toast} testID="toast">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  formContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  rowSplit: { flexDirection: "row", gap: spacing.md },
  timeBlock: {
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  timeBlockLabel: {
    fontSize: fontSize.sm,
    color: colors.onBrandTertiary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  durationIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  durationLabel: {
    fontSize: fontSize.sm,
    color: colors.onSurfaceSecondary,
  },
  durationValue: {
    fontSize: fontSize.lg,
    color: colors.onSurface,
    fontWeight: "500",
  },
  checkList: {
    gap: spacing.xs,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  checkboxSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  radioSelected: {
    borderColor: colors.brandPrimary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandPrimary,
  },
  checkText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.onSurface,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  addInlineBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  addInlineBtnDisabled: {
    backgroundColor: colors.surfaceTertiary,
  },
  chipRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexShrink: 0,
  },
  chipSelected: {
    backgroundColor: colors.brandSecondary,
    borderColor: colors.brandPrimary,
  },
  chipText: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: colors.onBrandSecondary,
  },
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
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopColor: colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    flex: 1,
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
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.onSurface,
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: 100,
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
