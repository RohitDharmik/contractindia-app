import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ServiceMasterGet,
  ServiceMasterSave,
  ServiceMasterUpdate,
  ServiceMasterDelete,
} from "../../api/api";

const COLORS = {
  primary: "#6D45D9",
  primaryLight: "#F1EDFF",
  background: "#F7F8FC",
  surface: "#FFFFFF",
  text: "#192238",
  muted: "#778198",
  border: "#E7EAF1",
  green: "#138A5B",
  greenLight: "#E8F8F0",
  red: "#D94343",
  redLight: "#FFF0F0",
  blue: "#2378C8",
  blueLight: "#EAF4FF",
  amber: "#B87912",
  amberLight: "#FFF5DE",
};

const EMPTY_FORM = {
  serviceName: "",
  serviceCode: "",
  serviceDescription: "",
  serviceURL: "",
  metaTitle: "",
  metaKeywords: "",
  metaDescription: "",
  searchKeywords: "",
  displayOrder: "0",
  isFeatured: 0,
  displayOnHomePage: 0,
  isActive: 1,
  isPopular: 0,
  isVerifiedRequired: 0,
  minSubscriptionLevel: "0",
};

const DEPTH_COLORS = ["#6D45D9", "#1686D9", "#16996A", "#D58A19", "#D64D78"];

const getField = (item, pascal, camel, fallback = "") =>
  item?.[pascal] ?? item?.[camel] ?? fallback;

const unwrapResponse = (response) => {
  let result = response?.data ?? response ?? {};

  if (typeof result === "string") {
    try {
      result = JSON.parse(result);
    } catch {
      return [];
    }
  }

  // Support APIs returning either an array or { data: [...] }.
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.result)) return result.result;

  return result;
};

const buildTree = (items) => {
  if (!Array.isArray(items)) return [];

  const map = new Map();
  const roots = [];

  items.forEach((item) => {
    const id = getField(item, "ServiceID", "serviceID", 0);
    const parentId = getField(item, "ParentServiceID", "parentServiceID", 0);

    map.set(String(id), {
      id: String(id),
      apiId: Number(id) || 0,
      parentApiId: Number(parentId) || 0,
      name: String(getField(item, "ServiceName", "serviceName", "")),
      serviceCode: String(getField(item, "ServiceCode", "serviceCode", "")),
      isActive:
        getField(item, "IsActive", "isActive", 1) === true ||
        Number(getField(item, "IsActive", "isActive", 1)) === 1,
      displayOrder: Number(getField(item, "DisplayOrder", "displayOrder", 0)),
      children: [],
      _raw: item,
    });
  });

  items.forEach((item) => {
    const id = String(getField(item, "ServiceID", "serviceID", 0));
    const parentId = String(
      getField(item, "ParentServiceID", "parentServiceID", 0),
    );

    const node = map.get(id);
    const parent = map.get(parentId);

    if (!parent || parentId === "0" || parentId === id) {
      roots.push(node);
    } else {
      parent.children.push(node);
    }
  });

  const sortTree = (nodes) => {
    nodes.sort((a, b) => a.displayOrder - b.displayOrder);
    nodes.forEach((node) => sortTree(node.children));
  };

  sortTree(roots);
  return roots;
};

const filterTree = (nodes, query) => {
  if (!query.trim()) return nodes;

  const term = query.trim().toLowerCase();

  return nodes.reduce((result, node) => {
    const children = filterTree(node.children || [], query);
    const matches =
      node.name.toLowerCase().includes(term) ||
      node.serviceCode.toLowerCase().includes(term);

    if (matches || children.length) {
      result.push({
        ...node,
        children,
        isSearchHighlight: matches,
      });
    }

    return result;
  }, []);
};

const countNodes = (nodes) =>
  nodes.reduce((total, node) => total + 1 + countNodes(node.children || []), 0);

const countActive = (nodes) =>
  nodes.reduce(
    (total, node) =>
      total + (node.isActive ? 1 : 0) + countActive(node.children || []),
    0,
  );

const getDescendantIds = (node) => [
  node.id,
  ...(node.children || []).flatMap(getDescendantIds),
];

const buildPayload = (form, parentServiceID = 0) => ({
  serviceID: 0,
  parentServiceID: Number(parentServiceID) || 0,
  serviceCode: form.serviceCode.trim(),
  serviceName: form.serviceName.trim(),
  serviceDescription: form.serviceDescription.trim(),
  serviceIcon: "",
  serviceImage: "",
  bannerImage: "",
  thumbnailImage: "",
  serviceURL: form.serviceURL.trim(),
  metaTitle: form.metaTitle.trim(),
  metaKeywords: form.metaKeywords.trim(),
  metaDescription: form.metaDescription.trim(),
  searchKeywords: form.searchKeywords.trim(),
  isFeatured: Number(form.isFeatured) || 0,
  displayOnHomePage: Number(form.displayOnHomePage) || 0,
  isPopular: Number(form.isPopular) || 0,
  isVerifiedRequired: Number(form.isVerifiedRequired) || 0,
  minSubscriptionLevel: Number(form.minSubscriptionLevel) || 0,
  isActive: Number(form.isActive),
  displayOrder: Number(form.displayOrder) || 0,
  createdBy: 0,
});

function IconButton({
  name,
  color = COLORS.muted,
  background = "#F1F3F8",
  onPress,
  size = 18,
  disabled = false,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: background },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </Pressable>
  );
}

function StatCard({ label, value, icon, color, background }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: background }]}>
        <MaterialCommunityIcons name={icon} size={19} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ServiceNode({
  node,
  depth,
  expandedIds,
  toggleExpanded,
  onEdit,
  onAddChild,
  onToggleActive,
  onDelete,
  dashboardMode,
  busyId,
}) {
  const expanded = expandedIds.includes(node.id);
  const hasChildren = node.children.length > 0;
  const busy = busyId === node.id;
  const color = DEPTH_COLORS[depth % DEPTH_COLORS.length];

  return (
    <View style={styles.nodeWrapper}>
      <View
        style={[
          styles.nodeCard,
          node.isSearchHighlight && styles.highlightedNode,
          { borderLeftColor: color },
        ]}
      >
        <View style={styles.nodeTopRow}>
          <Pressable
            onPress={() => {
              if (hasChildren) toggleExpanded(node.id);
            }}
            style={styles.expandButton}
            accessibilityRole="button"
            accessibilityLabel={
              expanded ? "Collapse service" : "Expand service"
            }
          >
            <MaterialCommunityIcons
              name={
                hasChildren
                  ? expanded
                    ? "chevron-down"
                    : "chevron-right"
                  : "circle-small"
              }
              size={24}
              color={color}
            />
          </Pressable>

          <View style={[styles.nodeDot, { backgroundColor: color }]} />

          <View style={styles.nodeInfo}>
            <Text style={styles.nodeName}>
              {node.name || "Unnamed service"}
            </Text>

            <View style={styles.nodeMetadata}>
              <Text style={[styles.levelBadge, { color }]}>
                LEVEL {depth + 1}
              </Text>

              {!!node.serviceCode && (
                <Text style={styles.serviceCode} numberOfLines={1}>
                  {node.serviceCode}
                </Text>
              )}
            </View>
          </View>

          {busy ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Pressable
              onPress={() => {
                if (dashboardMode) {
                  onToggleActive(node);
                } else {
                  toggleExpanded(node.id);
                }
              }}
              style={[
                styles.statusBadge,
                node.isActive ? styles.activeBadge : styles.inactiveBadge,
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
          )}
        </View>

        {!dashboardMode && (
          <View style={styles.nodeActions}>
            <Text style={styles.childCount}>
              {hasChildren
                ? `${node.children.length} direct subservices`
                : "No subservices"}
            </Text>

            <View style={styles.actionGroup}>
              <IconButton
                name="pencil-outline"
                color={COLORS.amber}
                background={COLORS.amberLight}
                onPress={() => onEdit(node)}
              />
              <IconButton
                name="plus"
                color={COLORS.blue}
                background={COLORS.blueLight}
                onPress={() => onAddChild(node)}
              />
              <IconButton
                name="trash-can-outline"
                color={COLORS.red}
                background={COLORS.redLight}
                onPress={() => onDelete(node)}
              />
            </View>
          </View>
        )}
      </View>

      {expanded && hasChildren && (
        <View style={styles.childrenContainer}>
          {node.children.map((child) => (
            <ServiceNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
              dashboardMode={dashboardMode}
              busyId={busyId}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={String(value ?? "")}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor="#A2AABC"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function ChoiceField({ label, value, onChange, options }) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => {
          const selected = Number(value) === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.choice, selected && styles.selectedChoice]}
            >
              <Text
                style={[
                  styles.choiceText,
                  selected && styles.selectedChoiceText,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ServiceEditor({
  visible,
  mode,
  parentName,
  initialNode,
  saving,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    if (!visible) return;

    if (mode === "edit" && initialNode?._raw) {
      const raw = initialNode._raw;

      setForm({
        serviceName: getField(raw, "ServiceName", "serviceName"),
        serviceCode: getField(raw, "ServiceCode", "serviceCode"),
        serviceDescription: getField(
          raw,
          "ServiceDescription",
          "serviceDescription",
        ),
        serviceURL: getField(raw, "ServiceURL", "serviceURL"),
        metaTitle: getField(raw, "MetaTitle", "metaTitle"),
        metaKeywords: getField(raw, "MetaKeywords", "metaKeywords"),
        metaDescription: getField(raw, "MetaDescription", "metaDescription"),
        searchKeywords: getField(raw, "SearchKeywords", "searchKeywords"),
        displayOrder: String(getField(raw, "DisplayOrder", "displayOrder", 0)),
        isFeatured: Number(getField(raw, "IsFeatured", "isFeatured", 0)),
        displayOnHomePage: Number(
          getField(raw, "DisplayOnHomePage", "displayOnHomePage", 0),
        ),
        isActive: Number(getField(raw, "IsActive", "isActive", 1)),
        isPopular: Number(getField(raw, "IsPopular", "isPopular", 0)),
        isVerifiedRequired: Number(
          getField(raw, "IsVerifiedRequired", "isVerifiedRequired", 0),
        ),
        minSubscriptionLevel: String(
          getField(raw, "MinSubscriptionLevel", "minSubscriptionLevel", 0),
        ),
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
  }, [visible, mode, initialNode?.id]);

  const updateField = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const submit = () => {
    if (!form.serviceName.trim()) {
      Alert.alert("Validation", "Service name is required.");
      return;
    }

    onSubmit(form);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleIcon}>
            <MaterialCommunityIcons
              name={mode === "edit" ? "pencil-outline" : "layers-plus"}
              size={22}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.modalTitleContainer}>
            <Text style={styles.modalTitle}>
              {mode === "edit"
                ? "Edit Service"
                : mode === "addChild"
                  ? "Add Subservice"
                  : "Add Root Service"}
            </Text>
            {!!parentName && mode !== "addRoot" && (
              <Text style={styles.modalSubtitle} numberOfLines={1}>
                Parent: {parentName}
              </Text>
            )}
          </View>

          <IconButton name="close" onPress={onClose} background="#F0F1F6" />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formContent}
          >
            <Text style={styles.sectionTitle}>Basic information</Text>

            <FormField
              label="Service name *"
              value={form.serviceName}
              onChangeText={(v) => updateField("serviceName", v)}
              placeholder="Enter service name"
            />

            <FormField
              label="Service code"
              value={form.serviceCode}
              onChangeText={(v) => updateField("serviceCode", v)}
              placeholder="e.g. EPC-001"
            />

            <FormField
              label="Display order"
              value={form.displayOrder}
              onChangeText={(v) => updateField("displayOrder", v)}
              keyboardType="numeric"
            />

            <FormField
              label="Description"
              value={form.serviceDescription}
              onChangeText={(v) => updateField("serviceDescription", v)}
              placeholder="Describe this service"
              multiline
            />

            <Text style={styles.sectionTitle}>Service settings</Text>

            <FormField
              label="Service URL"
              value={form.serviceURL}
              onChangeText={(v) => updateField("serviceURL", v)}
              placeholder="/services/example"
            />

            <FormField
              label="Search keywords"
              value={form.searchKeywords}
              onChangeText={(v) => updateField("searchKeywords", v)}
            />

            <ChoiceField
              label="Status"
              value={form.isActive}
              onChange={(v) => updateField("isActive", v)}
              options={[
                { label: "Active", value: 1 },
                { label: "Inactive", value: 0 },
              ]}
            />

            <ChoiceField
              label="Featured service"
              value={form.isFeatured}
              onChange={(v) => updateField("isFeatured", v)}
              options={[
                { label: "No", value: 0 },
                { label: "Yes", value: 1 },
              ]}
            />

            <ChoiceField
              label="Display on homepage"
              value={form.displayOnHomePage}
              onChange={(v) => updateField("displayOnHomePage", v)}
              options={[
                { label: "No", value: 0 },
                { label: "Yes", value: 1 },
              ]}
            />

            <ChoiceField
              label="Popular service"
              value={form.isPopular}
              onChange={(v) => updateField("isPopular", v)}
              options={[
                { label: "No", value: 0 },
                { label: "Yes", value: 1 },
              ]}
            />

            <ChoiceField
              label="Verification required"
              value={form.isVerifiedRequired}
              onChange={(v) => updateField("isVerifiedRequired", v)}
              options={[
                { label: "No", value: 0 },
                { label: "Yes", value: 1 },
              ]}
            />

            <FormField
              label="Minimum subscription level"
              value={form.minSubscriptionLevel}
              onChangeText={(v) => updateField("minSubscriptionLevel", v)}
              keyboardType="numeric"
            />

            <Text style={styles.sectionTitle}>SEO metadata</Text>

            <FormField
              label="Meta title"
              value={form.metaTitle}
              onChangeText={(v) => updateField("metaTitle", v)}
            />

            <FormField
              label="Meta keywords"
              value={form.metaKeywords}
              onChangeText={(v) => updateField("metaKeywords", v)}
              multiline
            />

            <FormField
              label="Meta description"
              value={form.metaDescription}
              onChangeText={(v) => updateField("metaDescription", v)}
              multiline
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={[styles.footerButton, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={submit}
              disabled={saving}
              style={[styles.footerButton, styles.saveButton]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="check"
                    size={19}
                    color="#FFFFFF"
                  />
                  <Text style={styles.saveButtonText}>
                    {mode === "edit" ? "Save changes" : "Create service"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export default function ServiceListScreen({
  navigation,
  route,
  dashboardMode = false,
  onSave,
  onBack,
}) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState([]);
  const [editor, setEditor] = useState({
    visible: false,
    mode: "addRoot",
    targetNode: null,
  });
  const [busyId, setBusyId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const servicesQuery = useQuery({
    queryKey: ["serviceMasterList"],
    queryFn: async () => {
      const response = await ServiceMasterGet();
      const result = unwrapResponse(response);

      // Do not silently treat an unexpected response as an empty list.
      if (!Array.isArray(result)) {
        throw new Error(
          result?.message || "Unexpected Service Master API response.",
        );
      }

      return result;
    },
    retry: 2,
  });

  const services = useMemo(
    () => buildTree(servicesQuery.data || []),
    [servicesQuery.data],
  );

  const visibleServices = useMemo(
    () => filterTree(services, search),
    [services, search],
  );

  const totalCount = useMemo(() => countNodes(services), [services]);
  const activeCount = useMemo(() => countActive(services), [services]);

  const toggleExpanded = useCallback((id) => {
    setExpandedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }, []);

  const expandAll = useCallback(() => {
    const allIds = [];

    const visit = (nodes) => {
      nodes.forEach((node) => {
        if (node.children.length) allIds.push(node.id);
        visit(node.children);
      });
    };

    visit(visibleServices);
    setExpandedIds(allIds);
  }, [visibleServices]);

  const closeEditor = useCallback(() => {
    setEditor({
      visible: false,
      mode: "addRoot",
      targetNode: null,
    });
  }, []);

  const createMutation = useMutation({
    mutationFn: (payload) => ServiceMasterSave(payload),
    onSuccess: async (response) => {
      const result = unwrapResponse(response);

      if (result?.status === false || result?.status === 0) {
        Alert.alert(
          "Unable to create service",
          result?.message || "Request failed.",
        );
        return;
      }

      Alert.alert(
        "Success",
        result?.message || "Service created successfully.",
      );
      closeEditor();
      await queryClient.invalidateQueries({
        queryKey: ["serviceMasterList"],
      });
    },
    onError: (error) => {
      Alert.alert("Error", error?.message || "Unable to create service.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => ServiceMasterUpdate(payload),
    onSuccess: async (response) => {
      const result = unwrapResponse(response);

      if (result?.status === false || result?.status === 0) {
        Alert.alert(
          "Unable to update service",
          result?.message || "Request failed.",
        );
        return;
      }

      closeEditor();
      await queryClient.invalidateQueries({
        queryKey: ["serviceMasterList"],
      });
      Alert.alert(
        "Success",
        result?.message || "Service updated successfully.",
      );
    },
    onError: (error) => {
      Alert.alert("Error", error?.message || "Unable to update service.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ServiceMasterDelete(id),
    onSuccess: async (response) => {
      const result = unwrapResponse(response);

      if (result?.status === false || result?.status === 0) {
        Alert.alert(
          "Unable to delete service",
          result?.message || "Request failed.",
        );
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["serviceMasterList"],
      });
      Alert.alert(
        "Success",
        result?.message || "Service deleted successfully.",
      );
    },
    onError: (error) => {
      Alert.alert("Error", error?.message || "Unable to delete service.");
    },
  });

  const openAddRoot = () =>
    setEditor({
      visible: true,
      mode: "addRoot",
      targetNode: null,
    });

  const openAddChild = (node) => {
    setEditor({
      visible: true,
      mode: "addChild",
      targetNode: node,
    });
  };

  const openEdit = (node) => {
    setEditor({
      visible: true,
      mode: "edit",
      targetNode: node,
    });
  };

  const handleSubmit = (form) => {
    const { mode, targetNode } = editor;

    if (mode === "edit") {
      if (!targetNode?.apiId) {
        Alert.alert("Error", "A valid service ID is required.");
        return;
      }

      const payload = {
        ...targetNode._raw,
        ...buildPayload(form, targetNode.parentApiId),
        ServiceID: targetNode.apiId,
        ParentServiceID: targetNode.parentApiId,
        ServiceCode: form.serviceCode.trim(),
        ServiceName: form.serviceName.trim(),
        ServiceDescription: form.serviceDescription.trim(),
        ServiceURL: form.serviceURL.trim(),
        MetaTitle: form.metaTitle.trim(),
        MetaKeywords: form.metaKeywords.trim(),
        MetaDescription: form.metaDescription.trim(),
        SearchKeywords: form.searchKeywords.trim(),
        IsFeatured: Number(form.isFeatured),
        DisplayOnHomePage: Number(form.displayOnHomePage),
        IsPopular: Number(form.isPopular),
        IsVerifiedRequired: Number(form.isVerifiedRequired),
        MinSubscriptionLevel: Number(form.minSubscriptionLevel) || 0,
        IsActive: Number(form.isActive),
        DisplayOrder: Number(form.displayOrder) || 0,
        UpdatedBy: 0,
        UpdatedDate: new Date().toISOString(),
      };

      setBusyId(targetNode.id);
      updateMutation.mutate(payload, {
        onSettled: () => setBusyId(null),
      });

      return;
    }

    const parentId = mode === "addChild" ? targetNode?.apiId || 0 : 0;

    const siblingCount =
      mode === "addChild" ? targetNode?.children?.length || 0 : services.length;

    const payload = {
      ...buildPayload(form, parentId),
      displayOrder: Number(form.displayOrder) || siblingCount + 1,
    };

    if (mode === "addChild" && !parentId) {
      Alert.alert(
        "Cannot add subservice",
        "The selected parent does not have a valid API service ID.",
      );
      return;
    }

    createMutation.mutate(payload);
  };

  const toggleActivation = (node) => {
    if (!node.apiId) {
      Alert.alert("Error", "A valid service ID is required.");
      return;
    }

    const payload = {
      ...node._raw,
      ServiceID: node.apiId,
      ParentServiceID: node.parentApiId,
      IsActive: node.isActive ? 0 : 1,
      UpdatedBy: 0,
      UpdatedDate: new Date().toISOString(),
    };

    setBusyId(node.id);

    updateMutation.mutate(payload, {
      onSettled: () => setBusyId(null),
    });
  };

  const confirmDelete = (node) => {
    if (!node.apiId) {
      Alert.alert("Error", "A valid service ID is required.");
      return;
    }

    Alert.alert(
      "Delete service?",
      `Delete "${node.name}" and its child services? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setBusyId(node.id);
            deleteMutation.mutate(node.apiId, {
              onSettled: () => setBusyId(null),
            });
          },
        },
      ],
    );
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await servicesQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  const renderNode = ({ item }) => (
    <ServiceNode
      node={item}
      depth={0}
      expandedIds={expandedIds}
      toggleExpanded={toggleExpanded}
      onEdit={openEdit}
      onAddChild={openAddChild}
      onToggleActive={toggleActivation}
      onDelete={confirmDelete}
      dashboardMode={dashboardMode}
      busyId={busyId}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.screen}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeadingRow}>
            <View style={styles.pageIcon}>
              <MaterialCommunityIcons
                name="file-tree-outline"
                size={25}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.pageHeadingContent}>
              <Text style={styles.pageTitle}>Service Listing</Text>
              <Text style={styles.pageSubtitle}>
                Manage service categories and subservices
              </Text>
            </View>

            <IconButton
              name="refresh"
              size={21}
              color={COLORS.primary}
              background={COLORS.primaryLight}
              onPress={refresh}
              disabled={servicesQuery.isFetching}
            />
          </View>

          {!dashboardMode && (
            <View style={styles.headerActions}>
              <Pressable
                style={styles.outlineButton}
                onPress={() => setExpandedIds([])}
              >
                <MaterialCommunityIcons
                  name="unfold-less-horizontal"
                  size={17}
                  color={COLORS.muted}
                />
                <Text style={styles.outlineButtonText}>Collapse all</Text>
              </Pressable>

              <Pressable style={styles.primaryButton} onPress={openAddRoot}>
                <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Add root</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Total services"
            value={totalCount}
            icon="file-tree-outline"
            color={COLORS.primary}
            background={COLORS.primaryLight}
          />
          <StatCard
            label="Active"
            value={activeCount}
            icon="check-circle-outline"
            color={COLORS.green}
            background={COLORS.greenLight}
          />
          <StatCard
            label="Inactive"
            value={totalCount - activeCount}
            icon="pause-circle-outline"
            color={COLORS.red}
            background={COLORS.redLight}
          />
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={21}
            color={COLORS.muted}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search services or service codes..."
            placeholderTextColor="#9AA3B5"
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />

          {!!search && (
            <IconButton
              name="close-circle"
              background="transparent"
              onPress={() => setSearch("")}
            />
          )}
        </View>

        <View style={styles.listHeader}>
          <View style={styles.listHeaderTitleRow}>
            <MaterialCommunityIcons
              name="source-branch"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.listHeaderTitle}>Service hierarchy</Text>
          </View>

          <Text style={styles.resultCount}>
            {visibleServices.length} root
            {visibleServices.length === 1 ? "" : "s"}
          </Text>
        </View>

        {servicesQuery.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateTitle}>Loading services...</Text>
            <Text style={styles.stateSubtitle}>
              Fetching your service hierarchy
            </Text>
          </View>
        ) : servicesQuery.isError ? (
          <View style={styles.centerState}>
            <MaterialCommunityIcons
              name="cloud-alert-outline"
              size={42}
              color={COLORS.red}
            />
            <Text style={styles.stateTitle}>Unable to load services</Text>
            <Text style={styles.stateSubtitle}>
              {servicesQuery.error?.message || "Please try again."}
            </Text>
            <Pressable style={styles.primaryButton} onPress={refresh}>
              <Text style={styles.primaryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={visibleServices}
            keyExtractor={(item) => item.id}
            renderItem={renderNode}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.centerState}>
                <MaterialCommunityIcons
                  name="folder-search-outline"
                  size={44}
                  color="#B8BED0"
                />
                <Text style={styles.stateTitle}>
                  {search ? "No matching services" : "No services found"}
                </Text>
                <Text style={styles.stateSubtitle}>
                  {search
                    ? "Try another service name or code."
                    : "Add a root service to get started."}
                </Text>
              </View>
            }
            ListFooterComponent={
              !dashboardMode && visibleServices.length > 0 ? (
                <Pressable onPress={expandAll} style={styles.expandAllButton}>
                  <MaterialCommunityIcons
                    name="unfold-more-horizontal"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.expandAllText}>
                    Expand all categories
                  </Text>
                </Pressable>
              ) : null
            }
          />
        )}

        {onBack && (
          <Pressable onPress={onBack} style={styles.bottomBackButton}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={COLORS.text}
            />
            <Text style={styles.bottomBackText}>Back</Text>
          </Pressable>
        )}

        {onSave && (
          <Pressable
            onPress={() => onSave(services)}
            style={styles.bottomSaveButton}
          >
            <Text style={styles.primaryButtonText}>Save & Continue</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={18}
              color="#FFFFFF"
            />
          </Pressable>
        )}
      </View>

      <ServiceEditor
        visible={editor.visible}
        mode={editor.mode}
        parentName={editor.targetNode?.name || ""}
        initialNode={editor.targetNode}
        saving={saving}
        onClose={closeEditor}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  pageHeader: {
    marginBottom: 16,
  },
  pageHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  pageIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pageHeadingContent: {
    flex: 1,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },
  headerActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },
  outlineButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  outlineButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 9,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    width: 33,
    height: 33,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  statValue: {
    fontSize: 21,
    fontWeight: "800",
    color: COLORS.text,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
    fontWeight: "600",
  },
  searchContainer: {
    height: 47,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    marginBottom: 17,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    paddingVertical: 8,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  listHeaderTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  resultCount: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 28,
    flexGrow: 1,
  },
  nodeWrapper: {
    marginBottom: 9,
  },
  nodeCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    backgroundColor: COLORS.surface,
    padding: 11,
    shadowColor: "#1C2540",
    shadowOpacity: 0.035,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  highlightedNode: {
    borderColor: "#C4B5FD",
    backgroundColor: "#FAF8FF",
  },
  nodeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  expandButton: {
    width: 26,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nodeInfo: {
    flex: 1,
    minWidth: 0,
  },
  nodeName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "750",
    lineHeight: 19,
  },
  nodeMetadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
    marginTop: 4,
  },
  levelBadge: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  serviceCode: {
    fontSize: 10,
    color: COLORS.muted,
    maxWidth: 130,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeBadge: {
    backgroundColor: COLORS.greenLight,
  },
  inactiveBadge: {
    backgroundColor: COLORS.redLight,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },
  nodeActions: {
    borderTopWidth: 1,
    borderTopColor: "#F0F1F6",
    marginTop: 10,
    paddingTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  childCount: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
  },
  actionGroup: {
    flexDirection: "row",
    gap: 7,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  childrenContainer: {
    marginLeft: 15,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: "#DDD5FA",
    marginTop: 8,
  },
  centerState: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 35,
    gap: 10,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  stateSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  expandAllButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    padding: 12,
    marginTop: 6,
  },
  expandAllText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
  },
  modalRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 17,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 10,
  },
  modalTitleIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 3,
  },
  formContent: {
    padding: 17,
    paddingBottom: 30,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginTop: 9,
    marginBottom: 15,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: "#566078",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 13,
  },
  multilineInput: {
    minHeight: 85,
  },
  choiceRow: {
    flexDirection: "row",
    gap: 8,
  },
  choice: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    backgroundColor: COLORS.surface,
  },
  selectedChoice: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  choiceText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  selectedChoiceText: {
    color: COLORS.primary,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  footerButton: {
    minHeight: 47,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 15,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  saveButton: {
    flex: 1.5,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  bottomBackButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  bottomBackText: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 12,
  },
  bottomSaveButton: {
    minHeight: 46,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 13,
    marginBottom: 8,
  },
});
