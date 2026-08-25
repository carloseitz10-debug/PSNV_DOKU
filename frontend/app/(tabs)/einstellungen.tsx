import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Field, TextField } from "@/src/components/form";
import { colors, spacing, radius, fontSize } from "@/src/theme";
import {
  getAllMissions,
  getSettings,
  removeCustomOrganisation,
  removeCustomStichwort,
  saveSettings,
} from "@/src/lib/storage";
import { exportCsv } from "@/src/lib/csv";
import {
  ORGANISATION_DEFAULT_OPTIONS,
  type Settings,
} from "@/src/types";

export default function EinstellungenScreen() {
  const [einsatzkraft, setEinsatzkraft] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [settings, setSettings] = useState<Settings>({
    einsatzkraft: "",
    organisation: "",
    customStichworte: [],
    customOrganisationen: [],
  });
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [missionCount, setMissionCount] = useState(0);

  const load = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
    setEinsatzkraft(s.einsatzkraft);
    setOrganisation(s.organisation);
    const missions = await getAllMissions();
    setMissionCount(missions.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const onSave = async () => {
    Keyboard.dismiss();
    const next: Settings = { ...settings, einsatzkraft, organisation };
    await saveSettings(next);
    setSettings(next);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast("Einstellungen gespeichert.");
  };

  const onExportCsv = async () => {
    setExporting(true);
    try {
      const missions = await getAllMissions();
      const res = await exportCsv(missions);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setToast(res.message);
    } catch (e: any) {
      setToast(`Fehler: ${e?.message ?? e}`);
    } finally {
      setExporting(false);
    }
  };

  const onRemoveStichwort = async (v: string) => {
    const next = await removeCustomStichwort(v);
    setSettings(next);
    Haptics.selectionAsync();
  };

  const onRemoveOrg = async (v: string) => {
    const next = await removeCustomOrganisation(v);
    setSettings(next);
    if (organisation === v) setOrganisation("");
    Haptics.selectionAsync();
  };

  const orgOptions = [
    ...ORGANISATION_DEFAULT_OPTIONS,
    ...settings.customOrganisationen,
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <ImageBackground
            source={{
              uri: "https://images.pexels.com/photos/8357144/pexels-photo-8357144.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            }}
            style={styles.hero}
            imageStyle={{ borderRadius: radius.lg }}
          >
            <LinearGradient
              colors={["transparent", "rgba(28,28,30,0.75)"]}
              style={styles.heroOverlay}
            >
              <Text style={styles.heroLabel}>Konfiguration</Text>
              <Text style={styles.heroTitle}>Einstellungen</Text>
            </LinearGradient>
          </ImageBackground>

          {/* Presets */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Standard-Daten</Text>
            <Text style={styles.sectionSubtitle}>
              Werden automatisch in neue Einsätze übernommen.
            </Text>
            <View style={{ gap: spacing.md, marginTop: spacing.md }}>
              <Field label="Name der Einsatzkraft">
                <TextField
                  value={einsatzkraft}
                  onChangeText={setEinsatzkraft}
                  placeholder="Vor- und Nachname"
                  testID="input-settings-einsatzkraft"
                />
              </Field>
              <Field label="Standard-Organisation (Vorauswahl)">
                <View style={styles.radioBlock}>
                  {orgOptions.map((opt) => {
                    const isSel = organisation === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setOrganisation(isSel ? "" : opt)}
                        style={styles.radioRow}
                        testID={`settings-radio-org-${opt}`}
                      >
                        <View style={[styles.radio, isSel && styles.radioSelected]}>
                          {isSel ? <View style={styles.radioDot} /> : null}
                        </View>
                        <Text style={styles.radioText}>{opt}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>
            </View>

            <Pressable
              onPress={onSave}
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && { opacity: 0.9 },
              ]}
              testID="save-settings-btn"
            >
              <Feather name="check" size={18} color={colors.onBrandPrimary} />
              <Text style={styles.saveBtnText}>Speichern</Text>
            </Pressable>
          </View>

          {/* CSV Export */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datenexport</Text>
            <Text style={styles.sectionSubtitle}>
              Exportiere alle {missionCount} dokumentierten Einsätze als CSV-Datei
              (Semikolon-getrennt, Excel-kompatibel).
            </Text>
            <Pressable
              onPress={onExportCsv}
              disabled={exporting || missionCount === 0}
              style={({ pressed }) => [
                styles.exportBtn,
                (exporting || missionCount === 0) && styles.exportBtnDisabled,
                pressed && !exporting && missionCount > 0 && { opacity: 0.9 },
              ]}
              testID="export-csv-btn"
            >
              {exporting ? (
                <ActivityIndicator color={colors.onBrandPrimary} />
              ) : (
                <>
                  <Feather
                    name="download"
                    size={18}
                    color={
                      missionCount === 0
                        ? colors.onSurfaceTertiary
                        : colors.onBrandPrimary
                    }
                  />
                  <Text
                    style={[
                      styles.exportBtnText,
                      missionCount === 0 && { color: colors.onSurfaceTertiary },
                    ]}
                  >
                    Alle Einsätze als CSV exportieren
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Manage custom lists */}
          {(settings.customStichworte.length > 0 ||
            settings.customOrganisationen.length > 0) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Eigene Auswahllisten</Text>
              <Text style={styles.sectionSubtitle}>
                Selbst hinzugefügte Optionen. Zum Entfernen tippen.
              </Text>

              {settings.customStichworte.length > 0 ? (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={styles.groupLabel}>Stichworte</Text>
                  <View style={styles.tagWrap}>
                    {settings.customStichworte.map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => onRemoveStichwort(s)}
                        style={styles.removableTag}
                        testID={`remove-custom-stichwort-${s}`}
                      >
                        <Text style={styles.removableTagText}>{s}</Text>
                        <Feather name="x" size={12} color={colors.error} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              {settings.customOrganisationen.length > 0 ? (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={styles.groupLabel}>Organisationen</Text>
                  <View style={styles.tagWrap}>
                    {settings.customOrganisationen.map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => onRemoveOrg(s)}
                        style={styles.removableTag}
                        testID={`remove-custom-org-${s}`}
                      >
                        <Text style={styles.removableTagText}>{s}</Text>
                        <Feather name="x" size={12} color={colors.error} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.infoIconWrap}>
              <Feather name="shield" size={18} color={colors.brandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Lokale Speicherung</Text>
              <Text style={styles.infoText}>
                Alle Einsätze werden ausschließlich lokal auf diesem Gerät
                gespeichert. Es findet keine Übertragung an einen Server statt.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconWrap}>
              <Feather name="info" size={18} color={colors.brandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>PSNV-B Doku</Text>
              <Text style={styles.infoText}>
                Psychosoziale Notfallversorgung – Betroffene. Version 1.2.
              </Text>
            </View>
          </View>
        </ScrollView>
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
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  hero: {
    height: 140,
    borderRadius: radius.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroOverlay: { padding: spacing.lg, borderRadius: radius.lg },
  heroLabel: {
    color: colors.onSurfaceInverse,
    fontSize: fontSize.sm,
    opacity: 0.8,
  },
  heroTitle: {
    color: colors.onSurfaceInverse,
    fontSize: 28,
    fontWeight: "500",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    color: colors.onSurface,
    fontWeight: "500",
  },
  sectionSubtitle: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  radioBlock: { gap: spacing.xs },
  radioRow: {
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
  radioSelected: { borderColor: colors.brandPrimary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandPrimary,
  },
  radioText: { flex: 1, fontSize: fontSize.base, color: colors.onSurface },
  saveBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  saveBtnText: {
    color: colors.onBrandPrimary,
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  exportBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  exportBtnDisabled: {
    backgroundColor: colors.surfaceTertiary,
  },
  exportBtnText: {
    color: colors.onBrandPrimary,
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  groupLabel: {
    fontSize: fontSize.sm,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  removableTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  removableTagText: {
    fontSize: fontSize.sm,
    color: colors.onSurface,
    fontWeight: "500",
  },
  infoCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    alignItems: "flex-start",
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    fontSize: fontSize.base,
    color: colors.onBrandTertiary,
    fontWeight: "500",
    marginBottom: 2,
  },
  infoText: {
    fontSize: fontSize.base,
    color: colors.onBrandTertiary,
    lineHeight: 20,
    opacity: 0.85,
  },
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxxl,
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
