import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, radius, fontSize } from "@/src/theme";
import { getAllMissions } from "@/src/lib/storage";
import type { Mission } from "@/src/types";

function formatDate(iso: string, time: string) {
  try {
    const d = new Date(iso + (time ? `T${time}` : "T00:00"));
    return d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <View style={styles.emptyWrap} testID="empty-state">
      <View style={styles.emptyIconWrap}>
        <Feather name="clipboard" size={40} color={colors.brandPrimary} />
      </View>
      <Text style={styles.emptyTitle}>Keine Einsätze dokumentiert</Text>
      <Text style={styles.emptySubtitle}>
        Tippe auf „Neuer Einsatz", um deinen ersten PSNV-B Einsatz zu dokumentieren.
      </Text>
      <Pressable
        onPress={onNew}
        style={({ pressed }) => [
          styles.emptyBtn,
          pressed && { opacity: 0.85 },
        ]}
        testID="empty-new-mission-btn"
      >
        <Feather name="plus" size={16} color={colors.onBrandPrimary} />
        <Text style={styles.emptyBtnText}>Neuen Einsatz starten</Text>
      </Pressable>
    </View>
  );
}

function MissionCard({ mission, onPress }: { mission: Mission; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { backgroundColor: colors.surfaceSecondary },
      ]}
      testID={`mission-card-${mission.id}`}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>
          {formatDate(mission.einsatzDatum, mission.einsatzZeit)}
          {mission.einsatzZeit ? ` · ${mission.einsatzZeit}` : ""}
        </Text>
        {mission.einsatzNummer ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>Nr. {mission.einsatzNummer}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {mission.stichwort || "Ohne Stichwort"}
      </Text>
      <View style={styles.cardRow}>
        <Feather name="map-pin" size={13} color={colors.onSurfaceSecondary} />
        <Text style={styles.cardSub} numberOfLines={1}>
          {mission.einsatzOrt || "Kein Ort"}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Feather name="user" size={13} color={colors.onSurfaceSecondary} />
        <Text style={styles.cardSub} numberOfLines={1}>
          {mission.einsatzkraft || "Keine Einsatzkraft"}
        </Text>
      </View>
    </Pressable>
  );
}

export default function EinsaetzeScreen() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await getAllMissions();
    setMissions(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header} testID="einsaetze-header">
        <Text style={styles.headerTitle}>Einsätze</Text>
        <Text style={styles.headerSubtitle}>
          {missions.length === 0
            ? "Noch keine Dokumentation"
            : `${missions.length} dokumentiert`}
        </Text>
      </View>

      {missions.length === 0 ? (
        <EmptyState onNew={() => router.push("/neu")} />
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MissionCard
              mission={item}
              onPress={() => router.push(`/einsatz/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandPrimary}
            />
          }
          testID="missions-list"
        />
      )}
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
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  cardDate: {
    fontSize: fontSize.sm,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.pill,
  },
  chipText: {
    fontSize: 10,
    color: colors.onBrandTertiary,
    fontWeight: "500",
  },
  cardTitle: {
    fontSize: fontSize.lg,
    color: colors.onSurface,
    fontWeight: "500",
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 2,
  },
  cardSub: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    color: colors.onSurface,
    fontWeight: "500",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  emptyBtnText: {
    color: colors.onBrandPrimary,
    fontSize: fontSize.base,
    fontWeight: "500",
  },
});
