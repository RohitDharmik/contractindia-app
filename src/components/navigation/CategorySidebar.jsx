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
import { useQuery } from "@tanstack/react-query";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/store/authStore";
import { useCategoryStore } from "@/store/categoryStore";
import {
  allIds,
  buildTree,
  col,
  fetchMenu,
  fetchSubscriptions,
  checkValidity,
  flattenTree,
  getAncestorIds,
  subtreeHasActive,
} from "@/utils/serviceData";

const C = {
  ink: "#0F172A",
  slate: "#1E293B",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  surface: "#FFFFFF",
  canvas: "#F8FAFC",
  primary: "#4F46E5",
  indigoLight: "#EEF2FF",
  brand: "#492A78",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  amberLine: "#FDE68A",
};

// Keeps matching nodes and their ancestors.
const filterTree = (nodes, term) =>
  nodes.reduce((acc, n) => {
    const self = (n.ServiceName ?? "").toLowerCase().includes(term);
    const kids = filterTree(n.children ?? [], term);
    if (self || kids.length) acc.push({ ...n, children: kids });
    return acc;
  }, []);

// Flattens visible rows so FlatList can virtualize the tree.
const flattenVisible = (nodes, expanded, depth = 0, out = []) => {
  nodes.forEach((node) => {
    out.push({ node, depth });
    if (expanded.has(node.ServiceID)) {
      flattenVisible(node.children ?? [], expanded, depth + 1, out);
    }
  });
  return out;
};

function CategoryRow({ node, depth, activeId, expanded, onPress, onToggle }) {
  const hasKids = (node.children?.length ?? 0) > 0;
  const isActive = node.ServiceID === activeId;
  const isAncestor = !isActive && subtreeHasActive(node, activeId);
  const c = col(depth);
  const dot = Math.max(6, 9 - depth);

  return (
    <View
      style={[
        styles.row,
        {
          marginLeft: depth * 14,
          backgroundColor: isActive
            ? c.activeBg
            : isAncestor
              ? c.softBg
              : "transparent",
        },
      ]}
    >
      <Pressable
        onPress={() => onPress(node)}
        accessibilityRole="button"
        accessibilityLabel={node.ServiceName}
        style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.8 }]}
      >
        <View
          style={{
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: isActive ? "#fff" : c.dot,
          }}
        />
        <Text
          numberOfLines={2}
          style={[
            styles.rowText,
            {
              fontSize: Math.max(12, 13 - depth * 0.5),
              color: isActive ? "#fff" : isAncestor ? c.softText : "#475569",
            },
          ]}
        >
          {node.ServiceName}
        </Text>
      </Pressable>
      {hasKids && (
        <Pressable
          onPress={() => onToggle(node.ServiceID)}
          accessibilityRole="button"
          accessibilityLabel={`${expanded ? "Collapse" : "Expand"} ${node.ServiceName}`}
          hitSlop={8}
          style={styles.rowToggle}
        >
          <Ionicons
            name={expanded ? "chevron-down" : "chevron-forward"}
            size={14}
            color={isActive ? "rgba(255,255,255,0.85)" : C.faint}
          />
        </Pressable>
      )}
    </View>
  );
}

function MembershipMini({ hasActivePlan, activeSub, onPress }) {
  return (
    <View
      style={[
        styles.member,
        hasActivePlan
          ? { backgroundColor: "#FAF5FF", borderColor: "#E9D5FF" }
          : { backgroundColor: C.amberLight, borderColor: C.amberLine },
      ]}
    >
      <Ionicons
        name={hasActivePlan ? "ribbon" : "alert-circle"}
        size={18}
        color={hasActivePlan ? C.brand : C.amber}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.memberEyebrow}>
          {hasActivePlan ? "Active membership" : "Membership required"}
        </Text>
        <Text style={styles.memberTitle} numberOfLines={1}>
          {hasActivePlan ? activeSub?.PlanName ?? "Plan" : "No active plan"}
        </Text>
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.memberBtn, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.memberBtnText}>
          {hasActivePlan ? "Upgrade" : "Buy plan"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function CategorySidebar({ navigation: drawerNavigation }) {
  const contextNavigation = useNavigation();
  const navigation = drawerNavigation ?? contextNavigation;
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();

  const loginResponce = useAuthStore((s) => s?.user);
  const isLoggedIn = !!(loginResponce?.isLoginSuccessful || loginResponce?.userId);
  const userId = loginResponce?.userId || 0;

  const activeId = useCategoryStore((s) => s.activeId);
  const expandedIds = useCategoryStore((s) => s.expandedIds);
  const select = useCategoryStore((s) => s.select);
  const toggle = useCategoryStore((s) => s.toggle);
  const setExpanded = useCategoryStore((s) => s.setExpanded);

  const menuQuery = useQuery({
    queryKey: ["ServiceMenuGetList"],
    queryFn: fetchMenu,
    staleTime: 5 * 60 * 1000,
  });
  const fullTree = useMemo(() => buildTree(menuQuery.data ?? []), [menuQuery.data]);
  const totalNodes = useMemo(() => flattenTree(fullTree).length, [fullTree]);

  const subsQuery = useQuery({
    queryKey: ["userSubscriptions", userId],
    queryFn: () => fetchSubscriptions(userId),
    enabled: !!userId && isLoggedIn,
    retry: false,
  });
  const validityQuery = useQuery({
    queryKey: ["CheckValidity", userId],
    queryFn: () => checkValidity(userId),
    enabled: !!userId && isLoggedIn,
    retry: false,
  });
  const activeSub =
    (subsQuery.data ?? []).find((s) => Number(s?.IsActive) === 1) ?? null;
  const hasActivePlan = !!validityQuery.data?.status;

  // While searching, show matches with every branch expanded.
  const visibleTree = useMemo(
    () => (term ? filterTree(fullTree, term) : fullTree),
    [fullTree, term],
  );
  const rows = useMemo(() => {
    const expanded = term ? new Set(allIds(visibleTree)) : expandedIds;
    return flattenVisible(visibleTree, expanded);
  }, [visibleTree, term, expandedIds]);

  const openCategory = useCallback(
    (node) => {
      select(node.ServiceID, [...getAncestorIds(fullTree, node.ServiceID)]);
      navigation.navigate("CompanySubServices", {
        serviceId: node.ServiceID,
        serviceName: node.ServiceName,
      });
      if (typeof navigation.closeDrawer === "function") navigation.closeDrawer();
      else navigation.dispatch(DrawerActions.closeDrawer());
    },
    [fullTree, select, navigation],
  );

  const expandAll = () => setExpanded(allIds(fullTree));
  const collapseAll = () => setExpanded([]);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View style={styles.headTop}>
          <Ionicons name="grid-outline" size={16} color={C.primary} />
          <Text style={styles.headTitle}>Services</Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{totalNodes}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Pressable onPress={expandAll} hitSlop={8} accessibilityRole="button" accessibilityLabel="Expand all" style={styles.iconBtn}>
            <Ionicons name="expand-outline" size={15} color={C.muted} />
          </Pressable>
          <Pressable onPress={collapseAll} hitSlop={8} accessibilityRole="button" accessibilityLabel="Collapse all" style={styles.iconBtn}>
            <Ionicons name="contract-outline" size={15} color={C.muted} />
          </Pressable>
        </View>

        <View style={styles.search}>
          <Ionicons name="search-outline" size={15} color={C.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Find a category"
            placeholderTextColor={C.faint}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
          {!!query && (
            <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={16} color={C.faint} />
            </Pressable>
          )}
        </View>
      </View>

      {menuQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : menuQuery.isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={22} color={C.faint} />
          <Text style={styles.stateText}>Could not load categories.</Text>
          <Pressable onPress={() => menuQuery.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.stateText}>
            {term ? "No categories match your search." : "No categories."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.node.ServiceID)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CategoryRow
              node={item.node}
              depth={item.depth}
              activeId={activeId}
              expanded={expandedIds.has(item.node.ServiceID)}
              onPress={openCategory}
              onToggle={toggle}
            />
          )}
          extraData={[activeId, expandedIds]}
        />
      )}

      {isLoggedIn && (
        <View style={styles.foot}>
          <MembershipMini
            hasActivePlan={hasActivePlan}
            activeSub={activeSub}
            onPress={() => navigation.navigate("PlansAndSubscriptions")}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  head: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    backgroundColor: C.canvas,
  },
  headTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  headTitle: { color: C.ink, fontSize: 14, fontWeight: "800" },
  countPill: {
    minWidth: 26,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.indigoLight,
  },
  countText: { color: C.primary, fontSize: 11, fontWeight: "800" },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.surface,
  },
  searchInput: { flex: 1, color: C.slate, fontSize: 13, paddingVertical: 0 },

  list: { padding: 8, paddingBottom: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 2,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 24,
  },
  rowToggle: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, fontWeight: "600", lineHeight: 17 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
  stateText: { color: C.muted, fontSize: 12, textAlign: "center" },
  retry: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: C.primary },
  retryText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  foot: { padding: 10, borderTopWidth: 1, borderTopColor: C.line },
  member: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  memberEyebrow: { color: C.muted, fontSize: 10, fontWeight: "700" },
  memberTitle: { color: C.ink, fontSize: 13, fontWeight: "800", marginTop: 1 },
  memberBtn: {
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.brand,
  },
  memberBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },
});