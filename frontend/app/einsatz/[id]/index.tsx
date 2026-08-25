import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, fontSize } from "@/src/theme";
import { deleteMission, getMission, saveMission } from "@/src/lib/storage";
import { printPdf, sharePdf } from "@/src/lib/pdf";
import type { Mission } from "@/src/types";

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value?.trim() ? value : "—"}</Text>
    </View>
  );
}

function ChipsRO({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return <Text style={styles.rowValue}>—</Text>;
  }
  return (
    <View style={styles.chipsWrap}>
      {items.map((item) => (
        <View key={item} style={styles.chip}>
          <Text style={styles.chipText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </View>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function EinsatzDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"share" | "print" | "delete" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const m = await getMission(id);
    setMission(m);
    setLoading(false);
  }, [id]);

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

  const onToggleLock = async (value: boolean) => {
    if (!mission) return;
    const updated: Mission = { ...mission, locked: value, updatedAt: new Date().toISOString() };
    setMission(updated);
    await saveMission(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToast(value ? "Einsatz schreibgeschützt." : "Schreibschutz aufgehoben.");
  };

  const onEdit = () => {
    if (!mission || mission.locked) return;
    router.push(`/einsatz/${mission.id}/edit`);
  };

  const onShare = async () => {
    if (!mission) return;
    try {
      setBusy("share");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await sharePdf(mission);
    } catch {
      setToast("PDF-Erstellung fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  };

  const onPrint = async () => {
    if (!mission) return;
    try {
      setBusy("print");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await printPdf(mission);
    } catch {
      setToast("Drucken fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async () => {
    if (!mission || mission.locked) return;
    setBusy("delete");
    await deleteMission(mission.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator color={colors.brandPrimary} />
      </SafeAreaView>
    );
  }

  if (!mission) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Einsatz nicht gefunden.</Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          testID="detail-back-btn"
        >
          <Text style={styles.backBtnText}>Zurück</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const locked = mission.locked;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          testID="detail-back"
          hitSlop={8}
        >
          <Feather name="chevron-left" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.topBarTitle}>Einsatz-Details</Text>
        <Pressable
          onPress={onDelete}
          disabled={locked}
          style={styles.iconBtn}
          testID="detail-delete"
          hitSlop={8}
        >
          <Feather
            name="trash-2"
            size={18}
            color={locked ? colors.onSurfaceTertiary : colors.error}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} testID="detail-scroll">
        <View style={styles.hero}>
          <Text style={styles.heroDate}>
            {formatDate(mission.einsatzDatum)}
            {mission.einsatzZeit ? ` · ${mission.einsatzZeit}` : ""}
          </Text>
          <Text style={styles.heroTitle}>
            {mission.stichwort || "Ohne Stichwort"}
          </Text>
          {mission.einsatzOrt ? (
            <View style={styles.heroRow}>
              <Feather name="map-pin" size={14} color={colors.onSurfaceSecondary} />
              <Text style={styles.heroSub}>{mission.einsatzOrt}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.lockCard} testID="lock-card">
          <View style={styles.lockIconWrap}>
            <Feather
              name={locked ? "lock" : "unlock"}
              size={18}
              color={locked ? colors.warning : colors.brandPrimary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lockTitle}>Schreibschutz</Text>
            <Text style={styles.lockSub}>
              {locked
                ? "Einsatz ist gesperrt. Zum Bearbeiten deaktivieren."
                : "Aktivieren, um versehentliche Änderungen zu verhindern."}
            </Text>
          </View>
          <Switch
            value={locked}
            onValueChange={onToggleLock}
            trackColor={{ false: colors.surfaceTertiary, true: colors.brandPrimary }}
            thumbColor={colors.surface}
            testID="lock-switch"
          />
        </View>

        <Pressable
          onPress={onEdit}
          disabled={locked}
          style={({ pressed }) => [
            styles.editBtn,
            locked && styles.editBtnDisabled,
            pressed && !locked && { opacity: 0.85 },
          ]}
          testID="edit-mission-btn"
        >
          <Feather
            name="edit-3"
            size={16}
            color={locked ? colors.onSurfaceTertiary : colors.brandPrimary}
          />
          <Text
            style={[styles.editBtnText, locked && { color: colors.onSurfaceTertiary }]}
          >
            {locked ? "Bearbeiten (gesperrt)" : "Einsatz bearbeiten"}
          </Text>
        </Pressable>

        <Section title="Einsatzdaten">
          <Row label="Einsatz-Nr." value={mission.einsatzNummer} />
          <Row label="Einsatzort" value={mission.einsatzOrt} />
          <Row label="Stichwort" value={mission.stichwort} />
          <Row
            label="Dauer"
            value={mission.dauerMinuten ? `${mission.dauerMinuten} Min.` : ""}
          />
          <Row label="Einsatzkraft" value={mission.einsatzkraft} />
          <Row label="Organisation" value={mission.organisation} />
        </Section>

        <Section title={`Betroffene (${mission.betroffene.length})`}>
          {mission.betroffene.map((b, i) => (
            <View key={i} style={styles.subCard}>
              <Text style={styles.subCardTitle}>Betroffene:r {i + 1}</Text>
              <Row label="Name / Bezeichnung" value={b.name} />
              <Row label="Alter" value={b.age} />
              <Row label="Geschlecht" value={b.gender} />
              <Row label="Rolle" value={b.role} />
            </View>
          ))}
        </Section>

        <Section title="Zustand & Symptome">
          <Text style={styles.rowLabel}>Symptome</Text>
          <ChipsRO items={mission.symptome} />
          {mission.symptomeNotiz ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{mission.symptomeNotiz}</Text>
            </View>
          ) : null}
        </Section>

        <Section title="Maßnahmen">
          <Text style={styles.rowLabel}>Durchgeführt</Text>
          <ChipsRO items={mission.massnahmen} />
          {mission.massnahmenNotiz ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{mission.massnahmenNotiz}</Text>
            </View>
          ) : null}
        </Section>

        <Section title="Verlauf">
          {mission.verlauf ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{mission.verlauf}</Text>
            </View>
          ) : (
            <Text style={styles.rowValue}>—</Text>
          )}
        </Section>

        <Section title="Übergabe">
          <Row label="Übergabe an" value={mission.uebergabeAn} />
          {mission.uebergabeNotiz ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{mission.uebergabeNotiz}</Text>
            </View>
          ) : null}
        </Section>

        {mission.eigeneNotizen ? (
          <Section title="Eigene Notizen">
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{mission.eigeneNotizen}</Text>
            </View>
          </Section>
        ) : null}

        <View style={{ height: 140 }} />
      </ScrollView>

      <View style={styles.stickyBar}>
        <Pressable
          onPress={onShare}
          disabled={busy !== null}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.9 },
            busy !== null && { opacity: 0.6 },
          ]}
          testID="export-pdf-btn"
        >
          {busy === "share" ? (
            <ActivityIndicator color={colors.onBrandPrimary} />
          ) : (
            <>
              <Feather name="share" size={18} color={colors.onBrandPrimary} />
              <Text style={styles.primaryBtnText}>Als PDF exportieren</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={onPrint}
          disabled={busy !== null}
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && { opacity: 0.85 },
            busy !== null && { opacity: 0.6 },
          ]}
          testID="print-pdf-btn"
        >
          {busy === "print" ? (
            <ActivityIndicator color={colors.brandPrimary} />
          ) : (
            <>
              <Feather name="printer" size={18} color={colors.brandPrimary} />
              <Text style={styles.secondaryBtnText}>Drucken</Text>
            </>
          )}
        </Pressable>
      </View>

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
  centerContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  errorText: {
    color: colors.onSurfaceSecondary,
    fontSize: fontSize.lg,
  },
  backBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
  },
  backBtnText: {
    color: colors.onBrandPrimary,
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomColor: colors.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
  },
  topBarTitle: {
    fontSize: fontSize.lg,
    color: colors.onSurface,
    fontWeight: "500",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  heroDate: {
    fontSize: fontSize.sm,
    color: colors.brandPrimary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 28,
    color: colors.onSurface,
    fontWeight: "500",
    marginTop: spacing.xs,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  heroSub: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
  },
  lockCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  lockIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  lockTitle: {
    fontSize: fontSize.base,
    color: colors.onSurface,
    fontWeight: "500",
  },
  lockSub: {
    fontSize: fontSize.sm,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandTertiary,
    marginBottom: spacing.md,
  },
  editBtnDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  editBtnText: {
    color: colors.brandPrimary,
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    color: colors.brandPrimary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomColor: colors.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowLabel: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    width: "42%",
  },
  rowValue: {
    fontSize: fontSize.base,
    color: colors.onSurface,
    fontWeight: "500",
    flex: 1,
  },
  subCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  subCardTitle: {
    fontSize: fontSize.base,
    color: colors.onBrandSecondary,
    fontWeight: "500",
    marginBottom: spacing.sm,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.onBrandTertiary,
    fontWeight: "500",
  },
  noteBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: {
    fontSize: fontSize.base,
    color: colors.onSurface,
    lineHeight: 20,
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
  primaryBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  primaryBtnText: {
    color: colors.onBrandPrimary,
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  secondaryBtnText: {
    color: colors.brandPrimary,
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
