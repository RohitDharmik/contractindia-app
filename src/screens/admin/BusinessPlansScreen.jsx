// screens/plans/BusinessPlansScreen.jsx
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
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  planMasterDelete,
  planMasterGet,
  planMasterSave,
  planMasterUpdate,
  membershipType,
  userType,
} from "../../api/api"; 
import ScreenHeader from "../../components/ScreenHeader";
import { Screen } from "@/components";
import { useNavigation } from "@react-navigation/native";
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
  red: "#DC2626",
  redLight: "#FEF2F2",
  redLine: "#FECACA",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  sky: "#0284C7",
  skyLight: "#F0F9FF",
};

const STAT_TONES = {
  violet: { bg: "#F3E8FF", fg: "#7C3AED" },
  sky: { bg: "#E0F2FE", fg: "#0284C7" },
  green: { bg: "#D1FAE5", fg: "#059669" },
};

/* ------------------------------------------------------------------ */
/* API adapters and helpers                                            */
/* ------------------------------------------------------------------ */

const unwrapList = (res) => {
  let data = res?.data ?? res ?? [];
  if (typeof data == "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = [];
    }
  }
  return Array.isArray(data) ? data : [];
};

const fetchPlans = async () => unwrapList(await planMasterGet());
const fetchUserTypes = async () => unwrapList(await userType());
const fetchMemberships = async () => unwrapList(await membershipType());

const pick = (o, a, b, d) => o?.[a] ?? o?.[b] ?? d;

const normalizePlan = (p) => ({
  raw: p,
  id: Number(pick(p, "PlanID", "planID", p?.id ?? 0)),
  name: pick(p, "PlanName", "planName", "Untitled plan"),
  price: Number(pick(p, "Price", "price", 0)),
  credits: Number(pick(p, "CreditsIncluded", "creditsIncluded", 0)),
  duration: pick(p, "DurationType", "durationType", ""),
  userType: Number(pick(p, "UserType", "userType", 0)),
  maxServices: Number(pick(p, "maxNoofServices", "MaxNoofServices", 0)),
  remark: pick(p, "Remark", "remark", ""),
});

const EMPTY_FORM = {
  planName: "",
  price: "",
  credits: "",
  maxServices: "",
  userType: null,
  duration: "Monthly",
  remark: "",
};

const formFromPlan = (p) => ({
  planName: p.name,
  price: String(p.price),
  credits: String(p.credits),
  maxServices: String(p.maxServices),
  userType: p.userType || null,
  duration: p.duration || "Monthly",
  remark: p.remark ?? "",
});

const buildPayload = (form, id, userTypeOptions) => ({
  planID: id || 0,
  planName: form?.planName.trim(),
  price: Number(form?.price) || 0,
  creditsIncluded: Number(form?.credits) || 0,
  durationType: form?.duration,
  remark: form?.remark,
  enterredIP: Platform?.OS, // no hostname on mobile; backend may overwrite
  enterredBy: 0,
  enterDate: new Date().toISOString(),
  maxNoofServices: Number(form?.maxServices) || 0,
  userType: Number(form?.userType) || 0,
  userTypeName:
    userTypeOptions.find((o) => o.value == Number(form?.userType))?.label ?? "",
});

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function StatTile({ icon, label, value, tone }) {
  const t = STAT_TONES[tone];
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIcon, { backgroundColor: t?.bg }]}>
        <Ionicons name={icon} size={16} color={t?.fg} />
      </View>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Tag({ icon, text }) {
  return (
    <View style={styles.tag}>
      <Ionicons name={icon} size={11} color={COLORS.muted} />
      <Text style={styles.tagText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function Metric({ icon, label, value }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={14} color={COLORS.primary} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ActionBtn({ icon, label, tone, onPress }) {
  const t = {
    default: { bg: COLORS.primaryLight, fg: COLORS.primary },
    amber: { bg: COLORS.amberLight, fg: COLORS.amber },
    red: { bg: COLORS.redLight, fg: COLORS.red },
  }[tone];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: t?.bg },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Ionicons name={icon} size={15} color={t?.fg} />
      <Text style={[styles.actionText, { color: t?.fg }]}>{label}</Text>
    </Pressable>
  );
}

function PlanCard({ plan, userTypeLabel, pending, onView, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Ionicons name="briefcase-outline" size={18} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardName} numberOfLines={1}>
            {plan.name}
          </Text>
          <View style={styles.tagRow}>
            <Tag icon="time-outline" text={plan.duration || "—"} />
            <Tag icon="people-outline" text={userTypeLabel} />
          </View>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.price}>₹{plan.price}</Text>
          <Text style={styles.priceSub}>#{plan.id}</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <Metric icon="ticket-outline" label="Credits" value={plan.credits} />
        <Metric
          icon="layers-outline"
          label="Max services"
          value={plan.maxServices}
        />
      </View>

      {!!plan.remark && (
        <Text style={styles.remark} numberOfLines={2}>
          {plan.remark}
        </Text>
      )}

      <View style={styles.cardActions}>
        <ActionBtn icon="eye-outline" label="View" onPress={onView} />
        <ActionBtn
          icon="pencil-outline"
          label="Edit"
          tone="amber"
          onPress={onEdit}
        />
        <ActionBtn
          icon="trash-outline"
          label="Delete"
          tone="red"
          onPress={onDelete}
        />
      </View>

      {pending && (
        <View style={styles.pendingOverlay}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

function BottomSheet({
  visible,
  title,
  subtitle,
  icon,
  onClose,
  footer,
  children,
}) {
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
        behavior={Platform?.OS == "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetIcon}>
              <Ionicons name={icon} size={18} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {title}
              </Text>
              {!!subtitle && <Text style={styles.sheetSub}>{subtitle}</Text>}
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={COLORS.ink} />
            </Pressable>
          </View>
          {children}
          {!!footer && <View style={styles.sheetFooter}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, icon, required, error, children }) {
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
      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={12} color={COLORS.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

function SelectField({
  label,
  icon,
  placeholder,
  value,
  options,
  error,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => String(o.value) == String(value));

  return (
    <Field label={label} icon={icon} required error={error}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.input, styles.selectInput, !!error && styles.inputError]}
      >
        <Text
          style={[styles.selectText, !current && { color: COLORS.faint }]}
          numberOfLines={1}
        >
          {current?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
      </Pressable>

      <BottomSheet
        visible={open}
        title={label}
        icon={icon}
        onClose={() => setOpen(false)}
      >
        <ScrollView contentContainerStyle={styles.optionList}>
          {options.map((o) => {
            const active = String(o.value) == String(value);
            return (
              <Pressable
                key={String(o.value)}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={[styles.option, active && styles.optionActive]}
              >
                <Text
                  style={[
                    styles.optionText,
                    active && { color: COLORS.primary },
                  ]}
                >
                  {o.label}
                </Text>
                {active && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={COLORS.primary}
                  />
                )}
              </Pressable>
            );
          })}
          {options.length == 0 && (
            <Text style={styles.stateText}>No options available.</Text>
          )}
        </ScrollView>
      </BottomSheet>
    </Field>
  );
}

function PlanFormSheet({
  visible,
  mode,
  plan,
  userTypeOptions,
  durationOptions,
  saving,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!visible) return;
    setForm(mode == "edit" && plan ? formFromPlan(plan) : EMPTY_FORM);
    setErrors({});
  }, [visible, mode, plan?.id]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.planName.trim()) next.planName = "Enter a plan name.";
    if (form.price === "") next.price = "Enter a price.";
    if (form.credits === "") next.credits = "Enter credits.";
    if (!form.maxServices) next.maxServices = "Enter max services.";
    if (!form.userType) next.userType = "Select a user type.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const submit = () => {
    if (validate()) onSubmit(form);
  };

  const isEdit = mode == "edit";

  return (
    <BottomSheet
      visible={visible}
      title={isEdit ? "Update business plan" : "Create business plan"}
      subtitle="Manage pricing and credits"
      icon={isEdit ? "pencil" : "add"}
      onClose={onClose}
      footer={
        <>
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
                  name={isEdit ? "checkmark" : "add"}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.primaryText}>
                  {isEdit ? "Update plan" : "Create plan"}
                </Text>
              </>
            )}
          </Pressable>
        </>
      }
    >
      <ScrollView
        contentContainerStyle={styles.sheetBody}
        keyboardShouldPersistTaps="handled"
      >
        <Field
          label="Plan name"
          icon="pricetag-outline"
          required
          error={errors.planName}
        >
          <TextInput
            value={form?.planName}
            onChangeText={(v) => set("planName", v)}
            placeholder="e.g. Basic Plan"
            placeholderTextColor={COLORS.faint}
            style={[styles.input, !!errors.planName && styles.inputError]}
          />
        </Field>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field
              label="Price (₹)"
              icon="cash-outline"
              required
              error={errors.price}
            >
              <TextInput
                value={form?.price}
                onChangeText={(v) => set("price", v.replace(/[^0-9.]/g, ""))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.faint}
                style={[styles.input, !!errors.price && styles.inputError]}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Credits"
              icon="ticket-outline"
              required
              error={errors.credits}
            >
              <TextInput
                value={form?.credits}
                onChangeText={(v) => set("credits", v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={COLORS.faint}
                style={[styles.input, !!errors.credits && styles.inputError]}
              />
            </Field>
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field
              label="Max services"
              icon="layers-outline"
              required
              error={errors.maxServices}
            >
              <TextInput
                value={form?.maxServices}
                onChangeText={(v) =>
                  set("maxServices", v.replace(/[^0-9]/g, ""))
                }
                keyboardType="number-pad"
                placeholder="1–1000"
                placeholderTextColor={COLORS.faint}
                style={[
                  styles.input,
                  !!errors.maxServices && styles.inputError,
                ]}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <SelectField
              label="Duration"
              icon="time-outline"
              placeholder="Select duration"
              value={form?.duration}
              options={durationOptions}
              onChange={(v) => set("duration", v)}
            />
          </View>
        </View>

        <SelectField
          label="User type"
          icon="people-outline"
          placeholder="Select user type"
          value={form?.userType}
          options={userTypeOptions}
          error={errors.userType}
          onChange={(v) => set("userType", v)}
        />

        <Field label="Remark / features" icon="document-text-outline">
          <TextInput
            value={form?.remark}
            onChangeText={(v) => set("remark", v)}
            placeholder="Add details or features…"
            placeholderTextColor={COLORS.faint}
            multiline
            style={[styles.input, styles.textarea]}
          />
        </Field>
      </ScrollView>
    </BottomSheet>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={15} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

function Toast({ toast, onHide }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onHide, 3000);
    return () => clearTimeout(t);
  }, [toast, onHide]);

  if (!toast) return null;
  const ok = toast?.type == "success";
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
        {toast?.message}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function BusinessPlansScreen() {
  const nav = useNavigation();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const columns = width >= 720 ? 2 : 1;

  const [sheet, setSheet] = useState(null); // { mode: "create" | "edit", plan }
  const [viewPlan, setViewPlan] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback(
    (type, message) => setToast({ type, message, key: Date.now() }),
    [],
  );
  const hideToast = useCallback(() => setToast(null), []);

  /* ── Queries ── */
  const {
    data: rawPlans,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["planMasterList"],
    queryFn: fetchPlans,
    retry: 1,
  });

  const { data: rawUserTypes } = useQuery({
    queryKey: ["userType"],
    queryFn: fetchUserTypes,
    staleTime: Infinity,
  });

  const { data: rawMemberships } = useQuery({
    queryKey: ["membershipTypeGetApi"],
    queryFn: fetchMemberships,
    staleTime: Infinity,
  });

  const plans = useMemo(() => (rawPlans ?? []).map(normalizePlan), [rawPlans]);

  const userTypeOptions = useMemo(
    () =>
      (rawUserTypes ?? []).map((t) => ({
        value: Number(t?.value ?? t?.Value),
        label: String(t?.label ?? t?.Label ?? t?.name ?? t?.Name ?? "User"),
      })),
    [rawUserTypes],
  );

  const durationOptions = useMemo(
    () =>
      (rawMemberships ?? []).map((m) => ({
        value: String(m.value ?? m.Value ?? ""),
        label: String(m.label ?? m.Label ?? ""),
      })),
    [rawMemberships],
  );

  const labelFor = useCallback(
    (id) => userTypeOptions.find((o) => o.value == Number(id))?.label ?? "—",
    [userTypeOptions],
  );

  const stats = useMemo(() => {
    const count = plans.length;
    const credits = plans.reduce((sum, p) => sum + p.credits, 0);
    const avg = count
      ? Math.round(plans.reduce((sum, p) => sum + p.price, 0) / count)
      : 0;
    return { count, credits, avg };
  }, [plans]);

  /* ── Mutations ── */
  const mutation = useMutation({
    mutationFn: async ({ kind, payload, id }) => {
      let r;
      if (kind == "save") r = await planMasterSave(payload);
      else if (kind == "update") r = await planMasterUpdate(payload);
      else r = await planMasterDelete(id);

      if (!r?.status) throw new Error(r?.message || "Request failed.");
      return r;
    },
    onSuccess: (r) => {
      showToast("success", r?.message || "Saved successfully.");
      setSheet(null);
      queryClient?.invalidateQueries({ queryKey: ["planMasterList"] });
    },
    onError: (e) => showToast("error", e?.message || "Something went wrong."),
  });

  const pendingId = mutation.isPending ? mutation.variables?.id : null;

  /* ── Actions ── */
  const openCreate = useCallback(
    () => setSheet({ mode: "create", plan: null }),
    [],
  );
  const openEdit = useCallback((plan) => {
    setViewPlan(null);
    setSheet({ mode: "edit", plan });
  }, []);

  const confirmDelete = useCallback(
    (plan) => {
      Alert?.alert(
        "Delete plan",
        `Delete "${plan.name}"? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => mutation.mutate({ kind: "delete", id: plan.id }),
          },
        ],
      );
    },
    [mutation],
  );

  const handleSubmit = useCallback(
    (form) => {
      const isEdit = sheet?.mode == "edit";
      const id = isEdit ? sheet?.plan.id : 0;
      mutation.mutate({
        kind: isEdit ? "update" : "save",
        id,
        payload: buildPayload(form, id, userTypeOptions),
      });
    },
    [sheet, userTypeOptions, mutation],
  );

  /* ── Render pieces ── */
  const headerActions = [
    {
      icon: "refresh-outline",
      label: "Refresh",
      onPress: () => refetch(),
      loading: isFetching && !isLoading,
    },
    {
      icon: "add",
      label: "Create plan",
      onPress: openCreate,
      variant: "primary",
    },
  ];

  const listHeader = (
    <View style={styles.listHead}>
      {!!error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORS.red} />
          <Text style={styles.errorBannerText} numberOfLines={2}>
            {error.message || "Failed to load plans."}
          </Text>
          <Pressable onPress={() => refetch()} hitSlop={8}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.statRow}>
        <StatTile
          icon="layers-outline"
          label="Plans"
          value={isLoading ? "—" : stats.count}
          tone="violet"
        />
        <StatTile
          icon="ticket-outline"
          label="Credits"
          value={isLoading ? "—" : stats.credits}
          tone="sky"
        />
        <StatTile
          icon="cash-outline"
          label="Avg price"
          value={isLoading ? "—" : `₹${stats.avg}`}
          tone="green"
        />
      </View>

      <View style={styles.sectionHead}>
        <Ionicons name="briefcase-outline" size={15} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>ALL PLANS</Text>
        {!isLoading && <Text style={styles.sectionCount}>{stats.count}</Text>}
      </View>
    </View>
  );

  const emptyState = isLoading ? (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.stateText}>Loading plans…</Text>
    </View>
  ) : (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name={error ? "cloud-offline-outline" : "file-tray-outline"}
          size={26}
          color={COLORS.faint}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {error ? "Could not load plans" : "No plans yet"}
      </Text>
      <Text style={styles.stateText}>
        {error
          ? "Pull down to try again."
          : 'Tap "Create plan" to add your first business plan.'}
      </Text>
    </View>
  );
  const handleBack = () => {
    if (nav.canGoBack()) {
      nav.goBack();
    } else {
      nav.navigate(Routes.AdminDashboard);
    }
  };
  return (
    <Screen>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />

      <ScreenHeader
        title="Business Plans"
        subtitle="Manage plan master entries"
        icon="briefcase"
        showBack
        onBack={handleBack}
        right={
          <View style={styles.headerActions}>
            {headerActions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={action.onPress}
                disabled={action.loading || action.disabled}
                style={styles.headerAction}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={COLORS.primary}
                />
              </Pressable>
            ))}
          </View>
        }
      />

      <FlatList
        key={`cols-${columns}`}
        data={isLoading ? [] : plans}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.colWrap : undefined}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={columns > 1 ? styles.half : null}>
            <PlanCard
              plan={item}
              userTypeLabel={labelFor(item.userType)}
              pending={pendingId == item.id}
              onView={() => setViewPlan(item)}
              onEdit={() => openEdit(item)}
              onDelete={() => confirmDelete(item)}
            />
          </View>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => refetch()}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      <PlanFormSheet
        visible={!!sheet}
        mode={sheet?.mode}
        plan={sheet?.plan}
        userTypeOptions={userTypeOptions}
        durationOptions={durationOptions}
        saving={mutation.isPending}
        onClose={() => setSheet(null)}
        onSubmit={handleSubmit}
      />

      <BottomSheet
        visible={!!viewPlan}
        title={viewPlan?.name ?? ""}
        subtitle="Plan details"
        icon="eye"
        onClose={() => setViewPlan(null)}
        footer={
          <>
            <Pressable
              onPress={() => setViewPlan(null)}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryText}>Close</Text>
            </Pressable>
            <Pressable
              onPress={() => openEdit(viewPlan)}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="pencil" size={15} color="#fff" />
              <Text style={styles.primaryText}>Edit plan</Text>
            </Pressable>
          </>
        }
      >
        <ScrollView contentContainerStyle={styles.sheetBody}>
          <DetailRow
            icon="cash-outline"
            label="Price"
            value={viewPlan ? `₹${viewPlan.price}` : ""}
          />
          <DetailRow
            icon="ticket-outline"
            label="Credits included"
            value={viewPlan?.credits}
          />
          <DetailRow
            icon="time-outline"
            label="Duration"
            value={viewPlan?.duration}
          />
          <DetailRow
            icon="people-outline"
            label="User type"
            value={viewPlan ? labelFor(viewPlan.userType) : ""}
          />
          <DetailRow
            icon="layers-outline"
            label="Max services"
            value={viewPlan?.maxServices}
          />
          <DetailRow
            icon="document-text-outline"
            label="Remark / features"
            value={viewPlan?.remark}
          />
        </ScrollView>
      </BottomSheet>

      <Toast toast={toast} onHide={hideToast} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet?.create({
  listContent: { paddingHorizontal: 14, paddingBottom: 32, flexGrow: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  colWrap: { gap: 12 },
  half: { flex: 1 },

  /* List header */
  listHead: { paddingTop: 12, gap: 12, marginBottom: 6 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.redLight,
    borderWidth: 1,
    borderColor: COLORS.redLine,
  },
  errorBannerText: {
    flex: 1,
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "600",
  },
  retryText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "800",
    textDecorationLine: "underline",
  },

  statRow: { flexDirection: "row", gap: 10 },
  statTile: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { color: COLORS.ink, fontSize: 17, fontWeight: "800" },
  statLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  sectionCount: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },

  /* Plan card */
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    elevation: 1,
    overflow: "hidden",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { color: COLORS.ink, fontSize: 15, fontWeight: "800" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: "#F1F5F9",
    maxWidth: 140,
  },
  tagText: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  priceBox: { alignItems: "flex-end" },
  price: { color: COLORS.primary, fontSize: 17, fontWeight: "800" },
  priceSub: { color: COLORS.faint, fontSize: 10, marginTop: 2 },

  metricsGrid: { flexDirection: "row", gap: 10, marginTop: 14 },
  metric: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  metricLabel: { color: COLORS.faint, fontSize: 10, fontWeight: "600" },
  metricValue: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 1,
  },

  remark: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 12 },

  cardActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 11,
  },
  actionText: { fontSize: 12, fontWeight: "800" },

  pendingOverlay: {
    ...StyleSheet?.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
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

  /* Sheets */
  sheetRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet?.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  sheet: {
    maxHeight: "90%",
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
  sheetBody: { padding: 18, gap: 14, flexShrink: 1 },
  sheetFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },

  /* Form */
  field: { gap: 6 },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  fieldLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
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
  inputError: { borderColor: COLORS.red, backgroundColor: COLORS.redLight },
  textarea: { minHeight: 96, paddingTop: 10, textAlignVertical: "top" },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  selectText: { flex: 1, color: COLORS.ink, fontSize: 14 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  errorText: { color: COLORS.red, fontSize: 11, fontWeight: "600" },

  optionList: { padding: 14, gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  optionActive: {
    borderColor: "#C4B5FD",
    backgroundColor: COLORS.primaryLight,
  },
  optionText: { color: COLORS.ink, fontSize: 14, fontWeight: "600" },

  /* Buttons */
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
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

  /* Details */
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },
  detailValue: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },

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
