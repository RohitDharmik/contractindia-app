// screens/services/ServiceListingScreen.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertBox } from "../../components";
import {
  ServiceMasterDelete,
  ServiceMasterGet,
  ServiceMasterSave,
  ServiceMasterUpdate,
} from "../../api/api";
import ScreenHeader from "../../components/ScreenHeader";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const COLORS = {
  primary: "#7C3AED",
  primaryLight: "#F3E8FF",
  ink: "#1E293B",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  surface: "#FFFFFF",
  canvas: "#F8FAFC",
  green: "#059669",
  greenLight: "#ECFDF5",
  greenLine: "#A7F3D0",
  red: "#DC2626",
  redLight: "#FEF2F2",
  amberLight: "#FFFBEB",
  amber: "#D97706",
  skyLight: "#F0F9FF",
  sky: "#0284C7",
};

// One tone per depth level, matching the colored levels in the web design.
const TONES = [
  { bg: "#EDE9FE", fg: "#7C3AED", guide: "#DDD6FE" },
  { bg: "#E0F2FE", fg: "#0284C7", guide: "#BAE6FD" },
  { bg: "#D1FAE5", fg: "#059669", guide: "#A7F3D0" },
  { bg: "#FEF3C7", fg: "#D97706", guide: "#FDE68A" },
  { bg: "#FFE4E6", fg: "#E11D48", guide: "#FECDD3" },
];

const MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

/* ------------------------------------------------------------------ */
/* API adapters                                                        */
/* ------------------------------------------------------------------ */

const getServiceList = async () => {
  const res = await ServiceMasterGet();
  let data = res?.data ?? [];
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = [];
    }
  }
  return Array.isArray(data) ? data : [];
};

const saveServiceApi = async (p = {}) =>
  (await ServiceMasterSave({
    serviceID: 0,
    parentServiceID: p.parentServiceID ?? 0,
    serviceCode: p.serviceCode ?? "",
    serviceName: p.serviceName ?? "",
    serviceDescription: p.serviceDescription ?? "",
    serviceURL: p.serviceURL ?? "",
    serviceIcon: "",
    serviceImage: "",
    bannerImage: "",
    thumbnailImage: "",
    metaTitle: "",
    metaKeywords: "",
    metaDescription: "",
    searchKeywords: "",
    isFeatured: p.isFeatured ?? 0,
    displayOnHomePage: 0,
    displayOrder: p.displayOrder ?? 0,
    isActive: p.isActive ?? 1,
    isPopular: 0,
    isVerifiedRequired: 0,
    minSubscriptionLevel: 0,
    createdBy: 0,
  })) ?? {};

// Edit payloads spread the original PascalCase record, so fields the form
// does not show (images, meta data) are preserved.
const updateServiceApi = async (p = {}) =>
  (await ServiceMasterUpdate({
    ServiceID: p.ServiceID,
    ParentServiceID: p.ParentServiceID ?? 0,
    ServiceCode: p.ServiceCode ?? "",
    ServiceName: p.ServiceName ?? "",
    ServiceDescription: p.ServiceDescription ?? "",
    ServiceURL: p.ServiceURL ?? "",
    ServiceIcon: p.ServiceIcon ?? "",
    ServiceImage: p.ServiceImage ?? "",
    BannerImage: p.BannerImage ?? "",
    ThumbnailImage: p.ThumbnailImage ?? "",
    MetaTitle: p.MetaTitle ?? "",
    MetaKeywords: p.MetaKeywords ?? "",
    MetaDescription: p.MetaDescription ?? "",
    SearchKeywords: p.SearchKeywords ?? "",
    IsFeatured: p.IsFeatured ?? 0,
    DisplayOnHomePage: p.DisplayOnHomePage ?? 0,
    IsPopular: p.IsPopular ?? 0,
    IsVerifiedRequired: p.IsVerifiedRequired ?? 0,
    MinSubscriptionLevel: p.MinSubscriptionLevel ?? 0,
    IsActive: p.IsActive ?? 1,
    DisplayOrder: p.DisplayOrder ?? 0,
    UpdatedBy: 0,
    UpdatedDate: new Date().toISOString(),
  })) ?? {};

const deleteServiceApi = async (serviceId) =>
  (await ServiceMasterDelete(serviceId)) ?? {};

/* ------------------------------------------------------------------ */
/* Tree helpers                                                        */
/* ------------------------------------------------------------------ */

const pick = (o, a, b, d) => o?.[a] ?? o?.[b] ?? d;

const buildTree = (list) => {
  if (!Array.isArray(list) || !list.length) return [];
  const map = {};

  list.forEach((item) => {
    const id = Number(pick(item, "ServiceID", "serviceID", 0));
    const active = pick(item, "IsActive", "isActive", 1);
    map[id] = {
      id: String(id),
      apiId: id,
      parentId: Number(pick(item, "ParentServiceID", "parentServiceID", 0)),
      name: pick(item, "ServiceName", "serviceName", ""),
      code: pick(item, "ServiceCode", "serviceCode", ""),
      order: Number(pick(item, "DisplayOrder", "displayOrder", 0)),
      isActive: active === 1 || active === true,
      children: [],
      raw: item,
    };
  });

  const roots = [];
  Object.values(map).forEach((node) => {
    const parent = map[node.parentId];
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  });

  const sort = (arr) => {
    arr.sort((a, b) => a.order - b.order);
    arr.forEach((n) => sort(n.children));
    return arr;
  };
  return sort(roots);
};

const countStats = (nodes) => {
  let total = 0;
  let active = 0;
  const walk = (list) =>
    list.forEach((n) => {
      total += 1;
      if (n.isActive) active += 1;
      walk(n.children);
    });
  walk(nodes);
  return { total, active, inactive: total - active, roots: nodes.length };
};

const allIds = (nodes, out = []) => {
  nodes.forEach((n) => {
    out.push(n.id);
    allIds(n.children, out);
  });
  return out;
};

// Keeps matching nodes plus their ancestors, so search results stay in context.
const filterTree = (nodes, term) =>
  nodes.reduce((acc, node) => {
    const selfMatch = !term || node.name.toLowerCase().includes(term);
    const children = filterTree(node.children, term);
    if (selfMatch || children.length) {
      acc.push({ ...node, children, matched: !!term && selfMatch });
    }
    return acc;
  }, []);

// Flattens the visible tree so FlatList can virtualize it.
const flattenVisible = (nodes, expandedSet, depth = 0, out = []) => {
  nodes.forEach((node) => {
    out.push({ node, depth });
    if (expandedSet.has(node.id))
      flattenVisible(node.children, expandedSet, depth + 1, out);
  });
  return out;
};

const fromRaw = (r = {}) => ({
  serviceName: pick(r, "ServiceName", "serviceName", ""),
  serviceCode: pick(r, "ServiceCode", "serviceCode", ""),
  serviceURL: pick(r, "ServiceURL", "serviceURL", ""),
  serviceDescription: pick(r, "ServiceDescription", "serviceDescription", ""),
  displayOrder: String(pick(r, "DisplayOrder", "displayOrder", 0)),
  isActive: Number(pick(r, "IsActive", "isActive", 1)),
  isFeatured: Number(pick(r, "IsFeatured", "isFeatured", 0)),
});

const EMPTY_FORM = {
  serviceName: "",
  serviceCode: "",
  serviceURL: "",
  serviceDescription: "",
  displayOrder: "0",
  isActive: 1,
  isFeatured: 0,
};

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function StatPill({ icon, label, tone = "default" }) {
  const green = tone === "green";
  return (
    <View style={[styles.pill, green && styles.pillGreen]}>
      <Ionicons
        name={icon}
        size={13}
        color={green ? COLORS.green : COLORS.primary}
      />
      <Text style={[styles.pillText, green && { color: COLORS.green }]}>
        {label}
      </Text>
    </View>
  );
}

function IconBtn({ icon, tone, onPress, label }) {
  const tones = {
    amber: { bg: COLORS.amberLight, fg: COLORS.amber },
    sky: { bg: COLORS.skyLight, fg: COLORS.sky },
    red: { bg: COLORS.redLight, fg: COLORS.red },
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: tones.bg },
        pressed && { transform: [{ scale: 0.92 }] },
      ]}
    >
      <Ionicons name={icon} size={16} color={tones.fg} />
    </Pressable>
  );
}

function TreeRow({
  node,
  depth,
  expanded,
  pending,
  readOnly,
  allowDelete,
  onToggle,
  onEdit,
  onAddChild,
  onDelete,
  onToggleActive,
}) {
  const tone = TONES[depth % TONES.length];
  const hasKids = node.children.length > 0;
  const indent = depth * 22;

  return (
    <View style={[styles.rowWrap, { paddingLeft: indent }]}>
      {depth > 0 && (
        <View
          style={[
            styles.guide,
            { left: indent - 11, backgroundColor: tone.guide },
          ]}
        />
      )}

      <Pressable
        onPress={() => hasKids && onToggle(node.id)}
        disabled={pending}
        android_ripple={{ color: "#EDE9FE" }}
        style={[styles.row, node.matched && styles.rowMatched]}
      >
        <View style={styles.chevronBox}>
          {hasKids ? (
            <Ionicons
              name={expanded ? "chevron-down" : "chevron-forward"}
              size={16}
              color={COLORS.faint}
            />
          ) : (
            <View style={[styles.leafDot, { backgroundColor: tone.fg }]} />
          )}
        </View>

        <View style={[styles.nodeIcon, { backgroundColor: tone.bg }]}>
          <Ionicons
            name={
              depth === 0
                ? "folder-open-outline"
                : depth === 1
                  ? "layers-outline"
                  : "pricetag-outline"
            }
            size={16}
            color={tone.fg}
          />
        </View>

        <View style={styles.nodeBody}>
          <Text style={styles.nodeName} numberOfLines={1}>
            {node.name || "Untitled"}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>L{depth + 1}</Text>
            </View>
            {!!node.code && (
              <View style={styles.codeChip}>
                <Text style={styles.codeText} numberOfLines={1}>
                  {node.code}
                </Text>
              </View>
            )}
            {node.apiId > 0 && <Text style={styles.idText}>#{node.apiId}</Text>}
          </View>
        </View>

        {hasKids && !expanded && (
          <View style={styles.subBadge}>
            <Text style={styles.subText}>{node.children.length} sub</Text>
          </View>
        )}

        {readOnly ? (
          <Pressable
            onPress={() => onToggleActive(node)}
            style={[
              styles.statusPill,
              node.isActive ? styles.statusOn : styles.statusOff,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: node.isActive ? COLORS.green : COLORS.red },
              ]}
            >
              {node.isActive ? "Active" : "Inactive"}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.actions}>
            <IconBtn
              icon="pencil-outline"
              tone="amber"
              label="Edit"
              onPress={() => onEdit(node)}
            />
            <IconBtn
              icon="add"
              tone="sky"
              label="Add child"
              onPress={() => onAddChild(node)}
            />
            {allowDelete && (
              <IconBtn
                icon="trash-outline"
                tone="red"
                label="Delete"
                onPress={() => onDelete(node)}
              />
            )}
          </View>
        )}
      </Pressable>

      {pending && (
        <View style={styles.pendingOverlay}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

function Toolbar({
  search,
  onSearch,
  stats,
  onExpandAll,
  onCollapseAll,
  fetchError,
  onRetry,
  showCount,
}) {
  return (
    <View style={styles.toolbar}>
      {!!fetchError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORS.red} />
          <Text style={styles.errorText} numberOfLines={2}>
            {fetchError.message || "Failed to load services."}
          </Text>
          <Pressable onPress={onRetry} hitSlop={8}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.faint} />
        <TextInput
          value={search}
          onChangeText={onSearch}
          placeholder="Search services…"
          placeholderTextColor={COLORS.faint}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
        />
        {!!search && (
          <Pressable onPress={() => onSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={COLORS.faint} />
          </Pressable>
        )}
      </View>

      <View style={styles.pillRow}>
        <StatPill
          icon="git-network-outline"
          label={`${showCount ? stats.total : "…"} total`}
        />
        <StatPill
          icon="pulse-outline"
          label={`${showCount ? stats.active : "…"} active`}
          tone="green"
        />
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={onExpandAll}
          disabled={!stats.total}
          style={({ pressed }) => [
            styles.smallBtn,
            pressed && { opacity: 0.7 },
            !stats.total && { opacity: 0.4 },
          ]}
        >
          <Ionicons name="expand-outline" size={14} color={COLORS.muted} />
        </Pressable>
        <Pressable
          onPress={onCollapseAll}
          style={({ pressed }) => [
            styles.smallBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="contract-outline" size={14} color={COLORS.muted} />
          <Text style={styles.smallBtnText}>Collapse all</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHead}>
        <Ionicons name="layers-outline" size={15} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>SERVICE HIERARCHY</Text>
      </View>
    </View>
  );
}

function Field({ label, icon, required, children }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Ionicons name={icon} size={13} color={COLORS.muted} />
        <Text style={styles.fieldLabel}>
          {label}
          {required ? " *" : ""}
        </Text>
      </View>
      {children}
    </View>
  );
}

function ToggleRow({ icon, label, hint, value, onValueChange }) {
  return (
    <View style={styles.toggleRow}>
      <View
        style={[
          styles.toggleIcon,
          value && { backgroundColor: COLORS.primaryLight },
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={value ? COLORS.primary : COLORS.faint}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#CBD5E1", true: "#C4B5FD" }}
        thumbColor={value ? COLORS.primary : "#F4F4F5"}
      />
    </View>
  );
}

function ServiceFormSheet({ visible, mode, node, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showNameAlert, setShowNameAlert] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setForm(mode === "edit" && node ? fromRaw(node.raw) : EMPTY_FORM);
  }, [visible, mode, node?.id]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const title =
    mode === "addRoot"
      ? "Add root service"
      : mode === "addChild"
        ? `Add child to ${node?.name ?? ""}`
        : "Edit service";

  const submit = () => {
    if (!form.serviceName.trim()) {
      setShowNameAlert(true);
      return;
    }
    onSubmit({
      ...form,
      serviceName: form.serviceName.trim(),
      displayOrder: Number(form.displayOrder) || 0,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.sheetRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetIcon}>
              <Ionicons
                name={mode === "edit" ? "pencil" : "add"}
                size={18}
                color="#fff"
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {title}
              </Text>
              {mode === "addChild" && (
                <Text style={styles.sheetSub}>
                  Nested under the selected parent
                </Text>
              )}
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={COLORS.ink} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
          >
            <Field label="Service name" icon="pricetag-outline" required>
              <TextInput
                value={form.serviceName}
                onChangeText={(v) => set("serviceName", v)}
                placeholder="e.g. EPC Consultancy"
                placeholderTextColor={COLORS.faint}
                style={styles.input}
              />
            </Field>

            <Field label="Service code" icon="barcode-outline">
              <TextInput
                value={form.serviceCode}
                onChangeText={(v) => set("serviceCode", v)}
                placeholder="e.g. EPC01"
                placeholderTextColor={COLORS.faint}
                autoCapitalize="characters"
                style={styles.input}
              />
            </Field>

            <Field label="Service URL" icon="link-outline">
              <TextInput
                value={form.serviceURL}
                onChangeText={(v) => set("serviceURL", v)}
                placeholder="/services/epc-consultancy"
                placeholderTextColor={COLORS.faint}
                autoCapitalize="none"
                style={styles.input}
              />
            </Field>

            <Field label="Description" icon="document-text-outline">
              <TextInput
                value={form.serviceDescription}
                onChangeText={(v) => set("serviceDescription", v)}
                placeholder="Short description…"
                placeholderTextColor={COLORS.faint}
                multiline
                style={[styles.input, styles.textarea]}
              />
            </Field>

            <Field label="Display order" icon="swap-vertical-outline">
              <TextInput
                value={form.displayOrder}
                onChangeText={(v) =>
                  set("displayOrder", v.replace(/[^0-9]/g, ""))
                }
                keyboardType="number-pad"
                style={styles.input}
              />
            </Field>

            <ToggleRow
              icon="power-outline"
              label="Active"
              hint="Visible to users"
              value={!!form.isActive}
              onValueChange={(v) => set("isActive", v ? 1 : 0)}
            />
            <ToggleRow
              icon="star-outline"
              label="Featured"
              hint="Highlight in listings"
              value={!!form.isFeatured}
              onValueChange={(v) => set("isFeatured", v ? 1 : 0)}
            />
          </ScrollView>

          <View style={styles.sheetFooter}>
            <Pressable onPress={onClose} style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={saving}
              style={({ pressed }) => [
                styles.primaryBtn,
                (saving || pressed) && { opacity: 0.8 },
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={mode === "edit" ? "checkmark" : "add"}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.primaryText}>
                    {mode === "edit" ? "Save changes" : "Create service"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
        <AlertBox
          visible={showNameAlert}
          title="Service name required"
          message="Enter a service name before saving."
          onConfirm={() => setShowNameAlert(false)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Toast({ toast, onHide }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onHide, 3000);
    return () => clearTimeout(t);
  }, [toast, onHide]);

  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <View
      style={[
        styles.toast,
        { backgroundColor: ok ? COLORS.green : COLORS.red },
      ]}
    >
      <Ionicons
        name={ok ? "checkmark-circle" : "alert-circle"}
        size={18}
        color="#fff"
      />
      <Text style={styles.toastText} numberOfLines={2}>
        {toast.message}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function ServiceManagement({
  onBack,
  onSave,
  dashboardMode = false,
  allowDelete = false,
}) {
  const queryClient = useQueryClient();
  const readOnly = dashboardMode;

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());
  const [sheet, setSheet] = useState(null); // { mode, node }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback(
    (type, message) => setToast({ type, message, key: Date.now() }),
    [],
  );
  const hideToast = useCallback(() => setToast(null), []);

  /* ── Fetch ── */
  const {
    data: list = [],
    isLoading,
    isFetching,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ["serviceMasterList"],
    queryFn: getServiceList,
    retry: 2,
  });

  const services = useMemo(() => buildTree(list), [list]);
  const stats = useMemo(() => countStats(services), [services]);

  const term = search.trim().toLowerCase();
  const processed = useMemo(() => filterTree(services, term), [services, term]);

  // While searching, every matching branch is expanded so results are visible.
  const { rows, expandedSet } = useMemo(() => {
    const set = term ? new Set(allIds(processed)) : expanded;
    return { expandedSet: set, rows: flattenVisible(processed, set) };
  }, [processed, expanded, term]);

  /* ── Mutations: one place for save, update and delete ── */
  const mutation = useMutation({
    mutationFn: async ({ kind, payload, apiId }) => {
      let r;
      if (kind === "save") r = await saveServiceApi(payload);
      else if (kind === "update") r = await updateServiceApi(payload);
      else r = await deleteServiceApi(apiId);

      if (!r?.status) throw new Error(r?.message || "Request failed.");
      return r;
    },
    onSuccess: (r) => {
      showToast("success", r?.message || "Saved successfully.");
      setSheet(null);
      queryClient.invalidateQueries({ queryKey: ["serviceMasterList"] });
      onSave?.(null);
    },
    onError: (e) => showToast("error", e?.message || "Something went wrong."),
  });

  const pendingNodeId = mutation.isPending ? mutation.variables?.nodeId : null;

  /* ── Expand / collapse ── */
  const toggleNode = useCallback((id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(new Set(allIds(services)));
  }, [services]);

  const collapseAll = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(new Set());
  }, []);

  /* ── Row actions ── */
  const openAddRoot = useCallback(
    () => setSheet({ mode: "addRoot", node: null }),
    [],
  );
  const openAddChild = useCallback(
    (node) => setSheet({ mode: "addChild", node }),
    [],
  );
  const openEdit = useCallback((node) => setSheet({ mode: "edit", node }), []);

  const toggleActive = useCallback(
    (node) => {
      mutation.mutate({
        kind: "update",
        nodeId: node.id,
        payload: {
          ...node.raw,
          ServiceID: node.apiId,
          IsActive: node.isActive ? 0 : 1,
        },
      });
    },
    [mutation],
  );

  const confirmDelete = useCallback(
    (node) => setDeleteTarget(node),
    [],
  );

  const deleteService = () => {
    if (!deleteTarget) return;
    mutation.mutate({
      kind: "delete",
      nodeId: deleteTarget.id,
      apiId: deleteTarget.apiId,
    });
    setDeleteTarget(null);
  };

  const handleFormSubmit = useCallback(
    (form) => {
      if (!sheet) return;
      const { mode, node } = sheet;

      if (mode === "addRoot") {
        mutation.mutate({
          kind: "save",
          nodeId: "new",
          payload: {
            ...form,
            parentServiceID: 0,
            displayOrder: form.displayOrder || stats.roots + 1,
          },
        });
        return;
      }

      if (mode === "addChild") {
        setExpanded((prev) => new Set(prev).add(node.id));
        mutation.mutate({
          kind: "save",
          nodeId: node.id,
          payload: {
            ...form,
            parentServiceID: node.apiId,
            displayOrder: form.displayOrder || node.children.length + 1,
          },
        });
        return;
      }

      mutation.mutate({
        kind: "update",
        nodeId: node.id,
        payload: {
          ...node.raw,
          ServiceID: node.apiId,
          ServiceName: form.serviceName,
          ServiceCode: form.serviceCode,
          ServiceURL: form.serviceURL,
          ServiceDescription: form.serviceDescription,
          DisplayOrder: form.displayOrder,
          IsActive: form.isActive,
          IsFeatured: form.isFeatured,
        },
      });
    },
    [sheet, stats.roots, mutation],
  );

  const handleSave = useCallback(
    () => onSave?.(rows.map((r) => r.node)),
    [onSave, rows],
  );

  /* ── Render ── */
  const headerActions = dashboardMode
    ? []
    : [
        {
          icon: "refresh-outline",
          label: "Refresh",
          onPress: () => refetch(),
          loading: isFetching && !isLoading,
        },
        {
          icon: "add",
          label: "Add root",
          onPress: openAddRoot,
          variant: "primary",
          disabled: mutation.isPending,
        },
      ];
  const handleBack = () => {
    if (nav.canGoBack()) {
      nav.goBack();
    } else {
      nav.navigate(Routes.AdminDashboard);
    }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />

      <ScreenHeader
        title="Service Listing"
        subtitle="Manage the full hierarchy of service categories"
        icon="layers"
        showBack={handleBack}
      />

      <FlatList
        data={isLoading ? [] : rows}
        keyExtractor={(item) => item.node.id}
        renderItem={({ item }) => (
          <TreeRow
            node={item.node}
            depth={item.depth}
            expanded={expandedSet.has(item.node.id)}
            pending={pendingNodeId === item.node.id}
            readOnly={readOnly}
            allowDelete={allowDelete}
            onToggle={toggleNode}
            onEdit={openEdit}
            onAddChild={openAddChild}
            onDelete={confirmDelete}
            onToggleActive={toggleActive}
          />
        )}
        ListHeaderComponent={
          <Toolbar
            search={search}
            onSearch={setSearch}
            stats={stats}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
            fetchError={fetchError}
            onRetry={() => refetch()}
            showCount={!isLoading}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.stateText}>Loading services…</Text>
            </View>
          ) : (
            <View style={styles.centerState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={
                    fetchError ? "cloud-offline-outline" : "file-tray-outline"
                  }
                  size={26}
                  color={COLORS.faint}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {fetchError
                  ? "Could not load services"
                  : term
                    ? "No matches"
                    : "No services yet"}
              </Text>
              <Text style={styles.stateText}>
                {term
                  ? "Try a different search term."
                  : readOnly
                    ? "Services will appear here once added."
                    : 'Tap "Add root" to create your first service.'}
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => refetch()}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListFooterComponent={
          onSave || onBack ? (
            <View style={styles.footer}>
              {onSave && (
                <Pressable
                  onPress={handleSave}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.primaryText}>Save & continue</Text>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </Pressable>
              )}
            </View>
          ) : null
        }
      />

      <ServiceFormSheet
        visible={!!sheet}
        mode={sheet?.mode}
        node={sheet?.node}
        saving={mutation.isPending}
        onClose={() => setSheet(null)}
        onSubmit={handleFormSubmit}
      />

      <AlertBox
        visible={!!deleteTarget}
        title="Delete service?"
        message={
          deleteTarget
            ? `Delete “${deleteTarget.name}”? All child services will also be removed.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={deleteService}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} onHide={hideToast} />
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  listContent: { paddingHorizontal: 14, paddingBottom: 32, flexGrow: 1 },

  /* Toolbar */
  toolbar: { paddingTop: 12, paddingBottom: 6, gap: 12 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.redLight,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: { flex: 1, color: COLORS.red, fontSize: 12, fontWeight: "600" },
  retryText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "800",
    textDecorationLine: "underline",
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    elevation: 1,
  },
  searchInput: { flex: 1, color: COLORS.ink, fontSize: 14, paddingVertical: 0 },

  pillRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  pillGreen: {
    backgroundColor: COLORS.greenLight,
    borderColor: COLORS.greenLine,
  },
  pillText: { color: COLORS.ink, fontSize: 12, fontWeight: "700" },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  smallBtnText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  /* Tree rows */
  rowWrap: { position: "relative", paddingVertical: 4 },
  guide: { position: "absolute", top: 0, bottom: 0, width: 2, borderRadius: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 62,
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
    elevation: 1,
  },
  rowMatched: { borderColor: "#C4B5FD", backgroundColor: "#FAF5FF" },
  chevronBox: { width: 18, alignItems: "center" },
  leafDot: { width: 6, height: 6, borderRadius: 3 },
  nodeIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeBody: { flex: 1, minWidth: 0 },
  nodeName: { color: COLORS.ink, fontSize: 14, fontWeight: "600" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  levelText: { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
  codeChip: {
    maxWidth: 110,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.canvas,
  },
  codeText: { color: COLORS.muted, fontSize: 10, fontFamily: MONO },
  idText: { color: COLORS.faint, fontSize: 10, fontFamily: MONO },
  subBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },
  subText: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusOn: { backgroundColor: COLORS.greenLight },
  statusOff: { backgroundColor: COLORS.redLight },
  statusText: { fontSize: 11, fontWeight: "800" },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },

  /* Empty / loading */
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: { color: COLORS.ink, fontSize: 15, fontWeight: "800" },
  stateText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },

  footer: { marginTop: 16 },

  /* Buttons */
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flex: 1,
  },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  secondaryBtn: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: COLORS.muted, fontSize: 14, fontWeight: "800" },

  /* Sheet */
  sheetRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  sheet: {
    maxHeight: "88%",
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  sheetIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "800" },
  sheetSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBody: { padding: 18, gap: 14 },
  sheetFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },

  field: { gap: 6 },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  fieldLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 12,
    color: COLORS.ink,
    fontSize: 14,
  },
  textarea: { minHeight: 90, paddingTop: 10, textAlignVertical: "top" },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  toggleIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLabel: { color: COLORS.ink, fontSize: 13, fontWeight: "700" },
  toggleHint: { color: COLORS.muted, fontSize: 11, marginTop: 2 },

  /* Toast */
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    elevation: 6,
  },
  toastText: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "700" },
});
