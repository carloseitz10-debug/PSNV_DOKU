import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, radius, fontSize } from "@/src/theme";
import { getAllMissions } from "@/src/lib/storage";
import type { Mission } from "@/src/types";

export default function StatistikScreen() {
  const [missions, setMissions] = useState<Mission[]>([]);

  const load = useCallback(async () => {
    const list = await getAllMissions();
    setMissions(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const stats = useMemo(() => {
    const total = missions.length;
    const now = new Date();
    const thisMonth = missions.filter((m) => {
      try {
        const d = new Date(m.einsatzDatum);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      } catch {
        return false;
      }
    }).length;

    const byStichwort = new Map<string, number>();
    const bySymptom = new Map<string, number>();
    let totalDauer = 0;
    let dauerCount = 0;
    let betroffeneTotal = 0;

    missions.forEach((m) => {
      const key = (m.stichwort || "Ohne Stichwort").trim() || "Ohne Stichwort";
      byStichwort.set(key, (byStichwort.get(key) ?? 0) + 1);
      m.symptome?.forEach((s) => {
        bySymptom.set(s, (bySymptom.get(s) ?? 0) + 1);
      });
      const dauer = parseInt(m.dauerMinuten, 10);
      if (!isNaN(dauer)) {
        totalDauer += dauer;
        dauerCount += 1;
      }
      betroffeneTotal += m.betroffene?.length ?? 0;
    });

    return {
      total,
      thisMonth,
      byStichwort: Array.from(byStichwort.entries()).sort((a, b) => b[1] - a[1]),
      bySymptom: Array.from(bySymptom.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6),
      avgDauer: dauerCount > 0 ? Math.round(totalDauer / dauerCount) : 0,
      betroffeneTotal,
    };
  }, [missions]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} testID="statistik-scroll">
        <ImageBackground
          source={{
            uri: "https://images.pexels.com/photos/97080/pexels-photo-97080.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          }}
          style={styles.hero}
          imageStyle={{ borderRadius: radius.lg }}
        >
          <LinearGradient
            colors={["transparent", "rgba(28,28,30,0.75)"]}
            style={styles.heroOverlay}
          >
            <Text style={styles.heroLabel}>Übersicht</Text>
            <Text style={styles.heroTitle}>Statistik</Text>
            <Text style={styles.heroSub}>
              {stats.total} Einsatz{stats.total === 1 ? "" : "e"} dokumentiert
            </Text>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="clipboard"
            label="Einsätze gesamt"
            value={String(stats.total)}
            testID="metric-total"
          />
          <MetricCard
            icon="calendar"
            label="Dieser Monat"
            value={String(stats.thisMonth)}
            testID="metric-month"
          />
          <MetricCard
            icon="users"
            label="Betroffene"
            value={String(stats.betroffeneTotal)}
            testID="metric-betroffene"
          />
          <MetricCard
            icon="clock"
            label="Ø Dauer"
            value={stats.avgDauer > 0 ? `${stats.avgDauer} min` : "—"}
            testID="metric-dauer"
          />
        </View>

        <Text style={styles.sectionTitle}>Häufigste Stichworte</Text>
        {stats.byStichwort.length === 0 ? (
          <EmptyBox text="Noch keine Daten für Statistiken." />
        ) : (
          <View style={styles.list}>
            {stats.byStichwort.slice(0, 8).map(([key, count]) => (
              <StatRow key={key} label={key} count={count} total={stats.total} />
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Häufigste Symptome</Text>
        {stats.bySymptom.length === 0 ? (
          <EmptyBox text="Noch keine Symptome erfasst." />
        ) : (
          <View style={styles.list}>
            {stats.bySymptom.map(([key, count]) => (
              <StatRow
                key={key}
                label={key}
                count={count}
                total={stats.bySymptom[0][1]}
                accent
              />
            ))}
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  label,
  value,
  testID,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  testID?: string;
}) {
  return (
    <View style={styles.metricCard} testID={testID}>
      <View style={styles.metricIconWrap}>
        <Feather name={icon} size={16} color={colors.brandPrimary} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function StatRow({
  label,
  count,
  total,
  accent,
}: {
  label: string;
  count: number;
  total: number;
  accent?: boolean;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
  return (
    <View style={styles.statRow}>
      <View style={styles.statRowHeader}>
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.statCount}>{count}</Text>
      </View>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${pct}%` },
            accent && { backgroundColor: colors.brandSecondary },
          ]}
        />
      </View>
    </View>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyBoxText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: {
    height: 140,
    borderRadius: radius.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroOverlay: {
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
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
  heroSub: {
    color: colors.onSurfaceInverse,
    fontSize: fontSize.base,
    opacity: 0.9,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metricCard: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: fontSize.xxl,
    color: colors.onSurface,
    fontWeight: "500",
  },
  metricLabel: {
    fontSize: fontSize.sm,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    color: colors.brandPrimary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  statRow: {
    gap: spacing.xs,
  },
  statRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: fontSize.base,
    color: colors.onSurface,
    fontWeight: "500",
    flex: 1,
    marginRight: spacing.sm,
  },
  statCount: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
  },
  barBg: {
    height: 8,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
  },
  emptyBox: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    alignItems: "center",
  },
  emptyBoxText: {
    color: colors.onSurfaceSecondary,
    fontSize: fontSize.base,
  },
});
