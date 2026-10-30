import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Screen,
  ScreenHeader,
  EmptyState,
  Button,
  RatingStars,
  Badge,
} from "@/components";
import { useFavoritesStore } from "@/store/favoritesStore";
import { mockServices } from "@/services/mockData";
import { colors } from "@/constants/colors";
import { radius, spacing, typography } from "@/constants/sizes";
import { formatINR } from "@/utils/formatters";
import { useNavigation } from "@react-navigation/native";
import { Routes } from "@/constants/routes";
export default function CompareScreen() {
  const compareIds = useFavoritesStore((s) => s.compareList);
  const clear = useFavoritesStore((s) => s.clearCompare);
  const toggle = useFavoritesStore((s) => s.toggleCompare);
  const nav = useNavigation();
  const items = mockServices.filter((s) => compareIds.includes(s.id));
  if (items.length === 0) {
    return (
      <Screen>
        <ScreenHeader title="Compare" showBack />
        <EmptyState
          icon="git-compare-outline"
          title="Nothing to compare yet"
          body="Tap the compare icon on services to add up to 3 items."
          action={
            <Button
              title="Browse services"
              onPress={() => nav.navigate(Routes.Categories)}
            />
          }
        />
      </Screen>
    );
  }
  const rows = [
    {
      key: "price",
      label: "Starting price",
      render: (s) => <Text style={styles.cell}>{formatINR(s.priceFrom)}</Text>,
    },
    {
      key: "unit",
      label: "Unit",
      render: (s) => <Text style={styles.cell}>{s.priceUnit}</Text>,
    },
    {
      key: "rating",
      label: "Rating",
      render: (s) => <RatingStars value={s.rating} />,
    },
    {
      key: "exp",
      label: "Experience",
      render: (s) => <Text style={styles.cell}>{s.experienceYears} yrs</Text>,
    },
    {
      key: "city",
      label: "Location",
      render: (s) => <Text style={styles.cell}>{s.city}</Text>,
    },
    {
      key: "tier",
      label: "Tier",
      render: (s) => (
        <Badge
          label={s.premium ? "Premium" : "Standard"}
          tone={s.premium ? "info" : "default"}
        />
      ),
    },
    {
      key: "deliv",
      label: "Deliverables",
      render: (s) => (
        <Text style={styles.cell}>{s.deliverables.slice(0, 3).join(", ")}</Text>
      ),
    },
  ];
  return (
    <Screen>
      <ScreenHeader
        title="Compare"
        showBack
        right={
          <Button title="Clear" variant="ghost" size="sm" onPress={clear} />
        }
      />
      <ScrollView horizontal contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ flexDirection: "row" }}>
          <View style={[styles.col, { width: 140 }]}>
            <View style={[styles.headerCell, { height: 90 }]} />
            {rows.map((r) => (
              <Text key={r.key} style={styles.rowLabel}>
                {r.label}
              </Text>
            ))}
            <View style={{ height: 50 }} />
          </View>
          {items.map((s) => (
            <View key={s.id} style={[styles.col, { width: 220 }]}>
              <View style={[styles.headerCell, { height: 90 }]}>
                <Text style={styles.serviceName} numberOfLines={2}>
                  {s.name}
                </Text>
                <Text style={styles.serviceMeta}>{s.city}</Text>
              </View>
              {rows.map((r) => (
                <View key={r.key} style={styles.rowCell}>
                  {r.render(s)}
                </View>
              ))}
              <Button
                title="Remove"
                variant="ghost"
                size="sm"
                onPress={() => toggle(s.id)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  col: {
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingRight: spacing.sm,
    marginRight: spacing.sm,
  },
  headerCell: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    justifyContent: "center",
  },
  serviceName: { ...typography.bodyBold, color: colors.text },
  serviceMeta: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  rowLabel: {
    ...typography.label,
    color: colors.textMuted,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  rowCell: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  cell: { ...typography.body, color: colors.text },
});
