import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "@/components";
import { Routes } from "@/constants/routes";
import { colors } from "@/constants/colors";
import { spacing, typography } from "@/constants/sizes";
import { useCategoryStore } from "@/store/categoryStore";
import {
  allIds,
  buildTree,
  col,
  fetchMenu,
  getAncestorIds,
  subtreeHasActive,
} from "@/utils/serviceData";

const filterTree = (nodes, term) =>
  nodes.reduce((matches, node) => {
    const children = filterTree(node.children ?? [], term);
    if ((node.ServiceName ?? "").toLowerCase().includes(term) || children.length) {
      matches.push({ ...node, children });
    }
    return matches;
  }, []);

const flattenVisible = (nodes, expandedIds, depth = 0, rows = []) => {
  nodes.forEach((node) => {
    const expanded = expandedIds.has(node.ServiceID);
    rows.push({ node, depth, expanded });
    if (expanded) flattenVisible(node.children ?? [], expandedIds, depth + 1, rows);
  });
  return rows;
};

function ServiceResult({ node, depth, activeId, expanded, onPress, onToggle }) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isActive = node.ServiceID === activeId;
  const isAncestor = !isActive && subtreeHasActive(node, activeId);
  const tone = col(depth);

  return (
    <View
      style={[
        styles.resultRow,
        {
          marginLeft: depth * 14,
          backgroundColor: isActive
            ? tone.activeBg
            : isAncestor
              ? tone.softBg
              : "transparent",
        },
      ]}
    >
      <Pressable
        onPress={() => onPress(node)}
        accessibilityRole="button"
        accessibilityLabel={`Browse ${node.ServiceName}`}
        style={({ pressed }) => [
          styles.resultMain,
          pressed && styles.resultPressed,
        ]}
      >
        <View
          style={[
            styles.resultIcon,
            {
              backgroundColor: isActive
                ? tone.activeBg
                : isAncestor
                  ? tone.softBg
                  : colors.surfaceAlt,
            },
          ]}
        >
          <Ionicons
            name={depth === 0 ? "grid-outline" : "construct-outline"}
            size={17}
            color={isActive ? "#FFFFFF" : tone.dot}
          />
        </View>
        <View style={styles.resultCopy}>
          <Text
            style={[
              styles.resultName,
              {
                color: isActive
                  ? colors.textInverse
                  : isAncestor
                    ? tone.softText
                    : colors.text,
              },
            ]}
            numberOfLines={2}
          >
            {node.ServiceName}
          </Text>
        </View>
      </Pressable>
      {hasChildren && (
        <Pressable
          onPress={() => onToggle(node.ServiceID)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${expanded ? "Collapse" : "Expand"} ${node.ServiceName}`}
          style={styles.rowToggle}
        >
          <Ionicons
            name={expanded ? "chevron-down" : "chevron-forward"}
            size={15}
            color={isActive ? "#FFFFFF" : colors.textMuted}
          />
        </Pressable>
      )}
    </View>
  );
}

function SearchState({ icon, message, action }) {
  return (
    <View style={styles.state}>
      {icon ? <Ionicons name={icon} size={24} color={colors.textMuted} /> : null}
      <Text style={styles.stateText}>{message}</Text>
      {action}
    </View>
  );
}

export default function SearchScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const selectCategory = useCategoryStore((state) => state.select);
  const activeId = useCategoryStore((state) => state.activeId);
  const expandedIds = useCategoryStore((state) => state.expandedIds);
  const toggleCategory = useCategoryStore((state) => state.toggle);
  const menuQuery = useQuery({
    queryKey: ["ServiceMenuGetList"],
    queryFn: fetchMenu,
    staleTime: 5 * 60 * 1000,
  });
  const serviceTree = useMemo(
    () => buildTree(menuQuery.data ?? []),
    [menuQuery.data],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    const visibleTree = normalizedQuery
      ? filterTree(serviceTree, normalizedQuery)
      : serviceTree;
    const visibleExpandedIds = normalizedQuery
      ? new Set(allIds(visibleTree))
      : expandedIds;
    return flattenVisible(visibleTree, visibleExpandedIds);
  }, [expandedIds, normalizedQuery, serviceTree]);

  const openCategory = useCallback(
    (node) => {
      selectCategory(node.ServiceID, [
        ...getAncestorIds(serviceTree, node.ServiceID),
      ]);
      navigation.navigate(Routes.MainTabs, {
        screen: Routes.CompanySubServices,
        params: {
          serviceId: node.ServiceID,
          serviceName: node.ServiceName,
        },
      });
    },
    [navigation, selectCategory, serviceTree],
  );

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={23} color={colors.text} />
        </Pressable>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Find a category"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search service categories"
          />
          {!!query && (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.heading}>
          {normalizedQuery ? "Matching services" : "Browse categories"}
        </Text>
        {!menuQuery.isLoading && !menuQuery.isError && (
          <Text style={styles.count}>{results.length}</Text>
        )}
      </View>

      {menuQuery.isLoading ? (
        <SearchState
          message="Loading services..."
          action={<ActivityIndicator color={colors.primary} />}
        />
      ) : menuQuery.isError ? (
        <SearchState
          icon="cloud-offline-outline"
          message="Could not load services."
          action={
            <Pressable
              onPress={() => menuQuery.refetch()}
              accessibilityRole="button"
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          }
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={({ node }) => String(node.ServiceID)}
          contentContainerStyle={styles.results}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ServiceResult
              node={item.node}
              depth={item.depth}
              activeId={activeId}
              expanded={item.expanded}
              onPress={openCategory}
              onToggle={toggleCategory}
            />
          )}
          extraData={[activeId, expandedIds]}
          ListEmptyComponent={
            <SearchState
              icon="search-outline"
              message={
                normalizedQuery
                  ? `No services match “${query.trim()}”.`
                  : "No services available."
              }
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, minWidth: 0, ...typography.body, color: colors.text },
  clearButton: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  heading: { ...typography.label, color: colors.text },
  count: { ...typography.small, color: colors.textMuted },
  results: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  resultRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: 2,
  },
  resultMain: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowToggle: {
    width: 36,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  resultPressed: { opacity: 0.7 },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  resultCopy: { flex: 1, minWidth: 0, gap: 2 },
  resultName: { ...typography.bodyBold },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  stateText: { ...typography.body, color: colors.textMuted, textAlign: "center" },
  retryButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  retryText: { ...typography.label, color: colors.primary },
});