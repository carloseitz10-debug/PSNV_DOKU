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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Field, TextField } from "@/src/components/form";
import { colors, spacing, radius, fontSize } from "@/src/theme";
import { getSettings, saveSettings } from "@/src/lib/storage";

export default function EinstellungenScreen() {
  const [einsatzkraft, setEinsatzkraft] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const s = await getSettings();
    setEinsatzkraft(s.einsatzkraft);
    setOrganisation(s.organisation);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const onSave = async () => {
    Keyboard.dismiss();
    await saveSettings({ einsatzkraft, organisation });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast("Einstellungen gespeichert.");
  };

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
              <Field label="Organisation">
                <TextField
                  value={organisation}
                  onChangeText={setOrganisation}
                  placeholder="z.B. Malteser, ASB, DRK, KIT"
                  testID="input-settings-organisation"
                />
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
                Psychosoziale Notfallversorgung – Betroffene. Version 1.0.
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
