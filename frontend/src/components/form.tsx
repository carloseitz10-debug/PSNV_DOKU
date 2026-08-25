import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, radius, fontSize } from "@/src/theme";

export function Section({
  title,
  children,
  first,
}: {
  title: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <View style={[styles.section, first && { marginTop: 0 }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: spacing.md }}>{children}</View>
    </View>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  testID,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  testID?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.onSurfaceTertiary}
      multiline={multiline}
      keyboardType={keyboardType}
      style={[styles.input, multiline && styles.textArea]}
      testID={testID}
    />
  );
}

export function ChipRow({
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

export function SegmentSelect<T extends string>({
  value,
  onChange,
  options,
  testIDPrefix,
}: {
  value: T;
  onChange: (v: T) => void;
  options: T[];
  testIDPrefix?: string;
}) {
  return (
    <View style={styles.segment}>
      {options.map((opt) => {
        const isSel = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.segmentItem, isSel && styles.segmentItemSelected]}
            testID={testIDPrefix ? `${testIDPrefix}-${opt}` : undefined}
          >
            <Text style={[styles.segmentText, isSel && styles.segmentTextSelected]}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Feather name={icon} size={16} color={colors.brandPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    color: colors.brandPrimary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.onSurfaceSecondary,
    marginBottom: spacing.xs,
    fontWeight: "500",
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    color: colors.onSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: spacing.md,
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
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 3,
    gap: 2,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  segmentItemSelected: {
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
  },
  segmentTextSelected: {
    color: colors.onSurface,
  },
  infoRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.onSurfaceSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.lg,
    color: colors.onSurface,
    fontWeight: "500",
  },
});
