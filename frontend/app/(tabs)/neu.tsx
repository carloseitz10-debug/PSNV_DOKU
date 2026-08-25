import { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MissionForm } from "@/src/components/mission-form";
import { colors, spacing, fontSize } from "@/src/theme";
import { getSettings, newMissionId, saveMission } from "@/src/lib/storage";
import type { Affected, Mission } from "@/src/types";

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
    alarmierungDatum: todayIso(),
    alarmierungZeit: nowTime(),
    eintreffenDatum: "",
    eintreffenZeit: "",
    einsatzendeDatum: "",
    einsatzendeZeit: "",
    einsatzOrt: "",
    einsatzNummer: "",
    einsatzkraft: "",
    organisation: "",
    stichworte: [],
    stichwortSonstiges: "",
    betroffene: [emptyAffected()],
    einsatzkraefteVorOrt: [],
    nachforderungen: [],
    nachforderungenSonstiges: "",
    setting: [],
    settingNotiz: "",
    weitereBeobachtungen: "",
    massnahmen: [],
    massnahmenNotiz: "",
    verlauf: "",
    uebergabeAn: "",
    uebergabeNotiz: "",
    eigeneNotizen: "",
    dauerMinuten: 0,
    locked: false,
  };
}

export default function NeuerEinsatzScreen() {
  const router = useRouter();
  const [initial, setInitial] = useState<Mission>(emptyMission());

  const resetForm = useCallback(async () => {
    const s = await getSettings();
    const fresh = emptyMission();
    fresh.einsatzkraft = s.einsatzkraft;
    fresh.organisation = s.organisation;
    setInitial(fresh);
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, [resetForm])
  );

  const onSubmit = async (m: Mission) => {
    const toSave: Mission = { ...m, updatedAt: new Date().toISOString() };
    await saveMission(toSave);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/einsatz/${toSave.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header} testID="neu-header">
        <Text style={styles.headerTitle}>Neuer Einsatz</Text>
        <Text style={styles.headerSubtitle}>PSNV-B Dokumentation</Text>
      </View>
      <MissionForm initial={initial} submitLabel="Speichern" onSubmit={onSubmit} />
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
});
