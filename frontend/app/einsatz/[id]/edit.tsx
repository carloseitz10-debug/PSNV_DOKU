import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MissionForm } from "@/src/components/mission-form";
import { colors, spacing, fontSize } from "@/src/theme";
import { getMission, saveMission } from "@/src/lib/storage";
import type { Mission } from "@/src/types";

export default function EditEinsatzScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    const m = await getMission(id);
    setMission(m);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (m: Mission) => {
    const updated: Mission = { ...m, updatedAt: new Date().toISOString() };
    await saveMission(updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/einsatz/${updated.id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.brandPrimary} />
      </SafeAreaView>
    );
  }

  if (!mission) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Einsatz nicht gefunden.</Text>
        <Pressable onPress={() => router.back()} testID="edit-back-btn">
          <Text style={styles.link}>Zurück</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (mission.locked) {
    return (
      <SafeAreaView style={styles.center}>
        <Feather name="lock" size={40} color={colors.warning} />
        <Text style={styles.lockedTitle}>Einsatz ist gesperrt</Text>
        <Text style={styles.lockedSub}>
          Deaktiviere zuerst den Schreibschutz in der Übersicht.
        </Text>
        <Pressable
          onPress={() => router.replace(`/einsatz/${mission.id}`)}
          testID="edit-locked-back-btn"
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>Zur Übersicht</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={8}
          testID="edit-back"
        >
          <Feather name="chevron-left" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.topBarTitle}>Einsatz bearbeiten</Text>
        <View style={styles.iconBtn} />
      </View>
      <MissionForm
        initial={mission}
        submitLabel="Änderungen speichern"
        onSubmit={onSubmit}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  error: { color: colors.onSurfaceSecondary, fontSize: fontSize.lg },
  link: { color: colors.brandPrimary, fontSize: fontSize.base, fontWeight: "500" },
  lockedTitle: {
    fontSize: fontSize.xl,
    color: colors.onSurface,
    fontWeight: "500",
    marginTop: spacing.md,
  },
  lockedSub: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  backBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 999,
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
});
