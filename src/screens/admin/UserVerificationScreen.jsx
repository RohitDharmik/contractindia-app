import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  userType,
  UserVerificationGet,
  verifyUserRegistration,
} from "../../api/api";
import AppHeader from "../../components/AppHeader";
import { useNavigation } from "@react-navigation/native";
import { Routes } from "@/constants/routes";
import ScreenHeader from "../../components/ScreenHeader";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const COLORS = {
  primary: "#4F46E5",
  primaryDark: "#4338CA",
  primaryLight: "#EEF2FF",
  ink: "#172033",
  muted: "#667085",
  faint: "#98A2B3",
  line: "#E5E7EB",
  surface: "#FFFFFF",
  canvas: "#F6F7FB",
  green: "#059669",
  greenLight: "#ECFDF3",
  red: "#DC2626",
  redLight: "#FEF2F2",
  amber: "#B45309",
  amberLight: "#FFFBEB",
  amberDot: "#F59E0B",
};

const AVATAR_PALETTE = [
  { bg: "#EEF2FF", fg: "#4F46E5" },
  { bg: "#ECFDF3", fg: "#059669" },
  { bg: "#FFF7ED", fg: "#C2410C" },
  { bg: "#FDF2F8", fg: "#BE185D" },
  { bg: "#ECFEFF", fg: "#0E7490" },
  { bg: "#F5F3FF", fg: "#6D28D9" },
];

const STATUS_ORDER = [0, 1, 2];
const STATUS_META = {
  0: {
    label: "Pending",
    icon: "time-outline",
    fg: COLORS.amber,
    bg: COLORS.amberLight,
    dot: COLORS.amberDot,
  },
  1: {
    label: "Approved",
    icon: "checkmark-circle-outline",
    fg: COLORS.green,
    bg: COLORS.greenLight,
    dot: COLORS.green,
  },
  2: {
    label: "Rejected",
    icon: "close-circle-outline",
    fg: COLORS.red,
    bg: COLORS.redLight,
    dot: COLORS.red,
  },
};

const SKELETON_ITEMS = [0, 1, 2, 3];

/* ------------------------------------------------------------------ */
/* Data helpers (unchanged API contract)                              */
/* ------------------------------------------------------------------ */

const getRows = async (status, usertype) => {
  const response = await UserVerificationGet(status, usertype);
  let data = response?.data ?? [];
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = [];
    }
  }
  return Array.isArray(data) ? data : [];
};

const getUserTypes = async () => {
  const response = await userType();
  let data = response?.data ?? response ?? [];
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = [];
    }
  }
  return Array.isArray(data) ? data : [];
};

const getId = (row) => row?.UserId ?? row?.userId ?? row?.UserID ?? row?.id;
const getName = (row) =>
  row?.Name ??
  row?.name ??
  row?.CompanyName ??
  row?.companyName ??
  "Unnamed user";
const getEmail = (row) => row?.EmailId ?? row?.emailId ?? row?.Email ?? "—";
const getMobile = (row) => row?.MobileNo ?? row?.mobileNo ?? row?.Mobile ?? "—";

const initialsOf = (name) =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() || "U";

const paletteFor = (seed) => {
  const n = String(seed ?? "")
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length];
};

const openLink = (url) => {
  Linking.openURL(url).catch(() => {});
};

/* ------------------------------------------------------------------ */
/* Animated press wrapper                                             */
/* ------------------------------------------------------------------ */

function PressScale({
  children,
  style,
  onPress,
  disabled,
  accessibilityLabel,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animateTo = (value) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                    */
/* ------------------------------------------------------------------ */

function Chip({ label, icon, active, onPress }) {
  return (
    <PressScale onPress={onPress} accessibilityLabel={label}>
      <View style={[styles.chip, active && styles.chipActive]}>
        {icon ? (
          <Ionicons
            name={icon}
            size={15}
            color={active ? "#fff" : COLORS.muted}
          />
        ) : null}
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </Text>
      </View>
    </PressScale>
  );
}

function IconButton({
  icon,
  onPress,
  disabled,
  label,
  tint = COLORS.muted,
  bg = "#F2F4F7",
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: bg },
        disabled && { opacity: 0.35 },
        pressed && { transform: [{ scale: 0.9 }] },
      ]}
    >
      <Ionicons name={icon} size={17} color={tint} />
    </Pressable>
  );
}

function ActionButton({ icon, label, onPress, tone = "primary" }) {
  const tones = {
    primary: { bg: COLORS.primaryLight, fg: COLORS.primary, border: "#C7D2FE" },
    approve: { bg: COLORS.greenLight, fg: COLORS.green, border: "#A7F3D0" },
    reject: { bg: COLORS.redLight, fg: COLORS.red, border: "#FECACA" },
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: tones.bg, borderColor: tones.border },
        pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
      ]}
    >
      <Ionicons name={icon} size={16} color={tones.fg} />
      <Text style={[styles.actionText, { color: tones.fg }]}>{label}</Text>
    </Pressable>
  );
}

function InfoLine({ icon, label, value }) {
  return (
    <View style={styles.infoLine}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={15} color={COLORS.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {String(value ?? "—")}
        </Text>
      </View>
    </View>
  );
}

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.userCard, { opacity }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: COLORS.line }]} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={[styles.skeletonLine, { width: "60%" }]} />
          <View style={[styles.skeletonLine, { width: "35%", height: 8 }]} />
        </View>
      </View>
      <View style={styles.infoGrid}>
        <View
          style={[styles.skeletonLine, { width: "90%", marginVertical: 8 }]}
        />
        <View
          style={[styles.skeletonLine, { width: "70%", marginVertical: 8 }]}
        />
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* User card                                                          */
/* ------------------------------------------------------------------ */

function UserCard({ item, status, commercial, onView, onVerify, onReject }) {
  const meta = STATUS_META[status];
  const name = getName(item);
  const id = getId(item);
  const pal = paletteFor(id ?? name);
  const email = getEmail(item);
  const mobile = getMobile(item);

  return (
    <PressScale
      onPress={() => onView(item)}
      accessibilityLabel={`View ${name}`}
    >
      <View style={styles.userCard}>
        <View style={[styles.accentBar, { backgroundColor: meta.dot }]} />

        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: pal.bg }]}>
            <Text style={[styles.avatarText, { color: pal.fg }]}>
              {initialsOf(name)}
            </Text>
          </View>

          <View style={styles.cardIdentity}>
            <Text style={styles.userName} numberOfLines={1}>
              {name}
            </Text>
            {commercial && item?.CompanyName ? (
              <Text style={styles.companyName} numberOfLines={1}>
                {item.CompanyName}
              </Text>
            ) : null}
            <View style={styles.idRow}>
              <View style={[styles.statusChip, { backgroundColor: meta.bg }]}>
                <Ionicons name={meta.icon} size={11} color={meta.fg} />
                <Text style={[styles.statusChipText, { color: meta.fg }]}>
                  {meta.label}
                </Text>
              </View>
              <Text style={styles.userId}>#{id ?? "—"}</Text>
            </View>
          </View>

          <View style={styles.quickIcons}>
            <IconButton
              icon="call-outline"
              label="Call applicant"
              disabled={mobile === "—"}
              onPress={() => openLink(`tel:${mobile}`)}
              tint={COLORS.primary}
              bg={COLORS.primaryLight}
            />
            <IconButton
              icon="mail-outline"
              label="Email applicant"
              disabled={email === "—"}
              onPress={() => openLink(`mailto:${email}`)}
              tint={COLORS.primary}
              bg={COLORS.primaryLight}
            />
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <InfoLine icon="mail-outline" label="Email" value={email} />
            <InfoLine icon="call-outline" label="Mobile" value={mobile} />
          </View>
          <View style={styles.infoRow}>
            <InfoLine
              icon="location-outline"
              label="State"
              value={item?.StateName ?? item?.stateName}
            />
            <InfoLine
              icon="pin-outline"
              label="Pin code"
              value={item?.PinCode ?? item?.pinCode}
            />
          </View>
          {commercial ? (
            <View style={styles.infoRow}>
              <InfoLine
                icon="briefcase-outline"
                label="Service"
                value={item?.ServiceName ?? item?.serviceName}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.cardActions}>
          <ActionButton
            icon="eye-outline"
            label="Details"
            onPress={() => onView(item)}
          />
          {status === 0 && (
            <>
              <ActionButton
                icon="checkmark-circle-outline"
                label="Verify"
                tone="approve"
                onPress={() => onVerify(item)}
              />
              <ActionButton
                icon="close-circle-outline"
                label="Reject"
                tone="reject"
                onPress={() => onReject(item)}
              />
            </>
          )}
        </View>
      </View>
    </PressScale>
  );
}

/* ------------------------------------------------------------------ */
/* Details modal                                                      */
/* ------------------------------------------------------------------ */

function UserDetailsModal({ user, wide, onClose }) {
  const name = getName(user);
  const pal = paletteFor(getId(user) ?? name);
  const email = getEmail(user);
  const mobile = getMobile(user);

  const fields = [
    { icon: "person-outline", label: "User ID", value: getId(user) },
    { icon: "mail-outline", label: "Email", value: email },
    { icon: "call-outline", label: "Mobile", value: mobile },
    { icon: "business-outline", label: "Company", value: user?.CompanyName },
    { icon: "briefcase-outline", label: "Service", value: user?.ServiceName },
    { icon: "location-outline", label: "State", value: user?.StateName },
    { icon: "map-outline", label: "Pin code", value: user?.PinCode },
    {
      icon: "calendar-outline",
      label: "Registered",
      value: user?.CreatedDate ?? user?.RegistrationDate,
    },
  ];

  return (
    <Modal
      visible
      transparent
      animationType={wide ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      <View style={[styles.modalRoot, wide && styles.modalRootWide]}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.detailSheet, wide && styles.detailSheetWide]}>
          {!wide && <View style={styles.sheetHandle} />}

          <View style={styles.sheetHeader}>
            <View style={[styles.sheetAvatar, { backgroundColor: pal.bg }]}>
              <Text style={[styles.avatarText, { color: pal.fg }]}>
                {initialsOf(name)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetEyebrow}>APPLICATION PROFILE</Text>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {name}
              </Text>
            </View>
            <IconButton icon="close" label="Close details" onPress={onClose} />
          </View>

          <View style={styles.quickRow}>
            <ActionButton
              icon="call-outline"
              label="Call"
              onPress={() => openLink(`tel:${mobile}`)}
            />
            <ActionButton
              icon="mail-outline"
              label="Email"
              onPress={() => openLink(`mailto:${email}`)}
            />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailCard}>
              {fields.map((f) => (
                <InfoLine
                  key={f.label}
                  icon={f.icon}
                  label={f.label}
                  value={f.value ?? "—"}
                />
              ))}
            </View>
            <Text style={styles.modalHint}>
              Showing profile fields available in the verification list
              response.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Confirm modal                                                      */
/* ------------------------------------------------------------------ */

function VerifyConfirmModal({
  action,
  user,
  loading,
  error,
  onCancel,
  onConfirm,
  wide,
}) {
  const [reason, setReason] = useState("");
  const rejecting = action === "Rejected";
  const accent = rejecting ? COLORS.red : COLORS.green;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onCancel} />
        <View style={[styles.confirmCard, wide && { maxWidth: 440 }]}>
          <View
            style={[
              styles.confirmIcon,
              {
                backgroundColor: rejecting
                  ? COLORS.redLight
                  : COLORS.greenLight,
              },
            ]}
          >
            <Ionicons
              name={
                rejecting ? "close-circle-outline" : "shield-checkmark-outline"
              }
              size={28}
              color={accent}
            />
          </View>

          <Text style={styles.confirmTitle}>
            {rejecting ? "Reject application?" : "Verify application?"}
          </Text>
          <Text style={styles.confirmBody}>
            Are you sure you want to {rejecting ? "reject" : "verify"}{" "}
            <Text style={{ fontWeight: "800", color: COLORS.ink }}>
              {getName(user)}
            </Text>
            ?
          </Text>

          {rejecting && (
            <View style={{ width: "100%", marginTop: 16 }}>
              <View style={styles.reasonHeader}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={14}
                  color={COLORS.muted}
                />
                <Text style={styles.reasonLabel}>Reason (optional)</Text>
                <Text style={styles.reasonCount}>{reason.length}/300</Text>
              </View>
              <TextInput
                value={reason}
                onChangeText={(t) => setReason(t.slice(0, 300))}
                placeholder="Explain why this application is being rejected"
                placeholderTextColor={COLORS.faint}
                multiline
                style={styles.reasonInput}
                textAlignVertical="top"
              />
            </View>
          )}

          {error ? (
            <View style={styles.inlineError}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={COLORS.red}
              />
              <Text style={styles.inlineErrorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.confirmActions}>
            <Pressable
              onPress={onCancel}
              disabled={loading}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm({ reason: reason.trim() })}
              disabled={loading}
              style={({ pressed }) => [
                styles.confirmButton,
                { backgroundColor: accent },
                (loading || pressed) && { opacity: 0.8 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={rejecting ? "close" : "checkmark"}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.confirmButtonText}>
                    {rejecting ? "Reject" : "Verify"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                             */
/* ------------------------------------------------------------------ */

export default function UserVerificationScreen() {
  const { width } = useWindowDimensions();
  const columns = width >= 1100 ? 3 : width >= 700 ? 2 : 1;
  const wide = width >= 700;

  const [tab, setTab] = useState(1);
  const [status, setStatus] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name"); // "name" | "newest"
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();
  const nav = useNavigation();
  const handleBack = () => {
    if (nav.canGoBack()) {
      nav.goBack();
    } else {
      nav.navigate(Routes.AdminDashboard);
    }
  };
  const { data: userTypeList = [], isLoading: typesLoading } = useQuery({
    queryKey: ["userType"],
    queryFn: getUserTypes,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (
      userTypeList.length &&
      !userTypeList.some((t) => Number(t.value ?? t.Value) === Number(tab))
    ) {
      setTab(Number(userTypeList[0].value ?? userTypeList[0].Value));
    }
  }, [userTypeList, tab]);

  // One query per status: gives live counts for the status cards and shares cache with the list.
  const statusQueries = useQueries({
    queries: STATUS_ORDER.map((s) => ({
      queryKey: ["userVerificationGetApi", s, tab],
      queryFn: () => getRows(s, tab),
      retry: 2,
    })),
  });
  const current = statusQueries[status];
  const listData = current?.data ?? [];

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const verifyMutation = useMutation({
    mutationFn: async ({ user, action, reason }) => {
      const id = getId(user);
      if (id == null) throw new Error("User ID not found.");
      const response = await verifyUserRegistration({
        userId: id,
        approved: action === "Verified" ? 1 : 2,
        reason,
      });
      if (response?.status === false) {
        throw new Error(
          response?.message || "Unable to update verification status.",
        );
      }
      return { action, user };
    },
    onSuccess: ({ action, user }) => {
      setConfirmState(null);
      setToast({
        type: "success",
        message: `${getName(user)} ${action === "Verified" ? "verified" : "rejected"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["userVerificationGetApi"] });
    },
  });

  const openConfirm = (action, user) => {
    verifyMutation.reset();
    setConfirmState({ action, user });
  };

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? listData.filter((r) =>
          [
            getName(r),
            getEmail(r),
            getMobile(r),
            r?.CompanyName,
            r?.ServiceName,
            r?.StateName,
            getId(r),
          ].some((v) =>
            String(v ?? "")
              .toLowerCase()
              .includes(term),
          ),
        )
      : listData;

    return [...filtered].sort((a, b) =>
      sortBy === "name"
        ? String(getName(a)).localeCompare(String(getName(b)))
        : Number(getId(b) ?? 0) - Number(getId(a) ?? 0),
    );
  }, [listData, search, sortBy]);

  const typeOptions = userTypeList.map((item) => ({
    value: Number(item.value ?? item.Value),
    label: String(item.label ?? item.Label ?? item.name ?? item.Name ?? "User"),
  }));
  const currentType =
    typeOptions.find((t) => t.value === Number(tab))?.label ??
    (Number(tab) === 2 ? "Commercial" : "Individual");
  const commercial = Number(tab) === 2;
  const pendingCount = (statusQueries[0]?.data ?? []).length;
  const showSkeleton = typesLoading || current?.isLoading;
  const refresh = () => current?.refetch();

  const listHeader = (
    <View>
      {/* Top bar */}
      {/* <View style={styles.header}>
        <View style={styles.headingIcon}>
          <Ionicons name="shield-checkmark" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>User Verification</Text>
          <Text style={styles.pageSubtitle}>Review and manage registration requests</Text>
        </View>
        {current?.isFetching ? (
          <View style={styles.refreshSpinner}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <IconButton icon="refresh-outline" label="Refresh" onPress={refresh} tint={COLORS.primary} bg={COLORS.primaryLight} />
        )}
      </View> */}
      <ScreenHeader
        title="User verification"
        subtitle="Manage registration requests"
        icon="shield-checkmark"
        showBack={handleBack}
        // onBack={handleBack}
      />

      {/* Hero banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroIcon}>
          <Ionicons name="hourglass-outline" size={20} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroValue}>{pendingCount}</Text>
          <Text style={styles.heroLabel}>
            {pendingCount === 1 ? "application" : "applications"} awaiting
            review
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
      </View>

      {/* User type */}
      <Text style={styles.sectionLabel}>USER TYPE</Text>
      {typesLoading ? (
        <ActivityIndicator
          color={COLORS.primary}
          style={{ alignSelf: "flex-start", marginBottom: 16 }}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {typeOptions.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              icon={item.value === 2 ? "business-outline" : "person-outline"}
              active={Number(tab) === item.value}
              onPress={() => setTab(item.value)}
            />
          ))}
        </ScrollView>
      )}

      {/* Status cards */}
      <Text style={styles.sectionLabel}>APPLICATION STATUS</Text>
      <View style={styles.statusGrid}>
        {STATUS_ORDER.map((s, i) => {
          const meta = STATUS_META[s];
          const active = status === s;
          const q = statusQueries[i];
          return (
            <View key={s} style={{ flex: 1 }}>
              <PressScale
                onPress={() => setStatus(s)}
                accessibilityLabel={`${meta.label} applications`}
              >
                <View
                  style={[
                    styles.statusCard,
                    active && {
                      borderColor: meta.fg,
                      backgroundColor: meta.bg,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusIcon,
                      { backgroundColor: active ? "#fff" : meta.bg },
                    ]}
                  >
                    <Ionicons name={meta.icon} size={17} color={meta.fg} />
                  </View>
                  <Text style={styles.statusCount}>
                    {q?.isLoading ? "–" : (q?.data ?? []).length}
                  </Text>
                  <Text
                    style={[styles.statusLabel, active && { color: meta.fg }]}
                  >
                    {meta.label}
                  </Text>
                </View>
              </PressScale>
            </View>
          );
        })}
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, email, mobile, service…"
            placeholderTextColor={COLORS.faint}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {!!search && (
            <Pressable
              onPress={() => setSearch("")}
              hitSlop={8}
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color={COLORS.faint} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.sortRow}>
        <Ionicons name="funnel-outline" size={14} color={COLORS.muted} />
        <Chip
          label="Name A–Z"
          icon="text-outline"
          active={sortBy === "name"}
          onPress={() => setSortBy("name")}
        />
        <Chip
          label="Newest"
          icon="time-outline"
          active={sortBy === "newest"}
          onPress={() => setSortBy("newest")}
        />
      </View>

      {/* List heading */}
      <View style={styles.listHeading}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>{currentType} Applications</Text>
          <Text style={styles.listSubtitle}>
            {showSkeleton
              ? "Loading…"
              : `${rows.length} ${rows.length === 1 ? "record" : "records"} found`}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {showSkeleton ? "…" : rows.length}
          </Text>
        </View>
      </View>
    </View>
  );

  const listEmpty = current?.isError ? (
    <View style={styles.centerState}>
      <View style={[styles.emptyIcon, { backgroundColor: COLORS.redLight }]}>
        <Ionicons name="cloud-offline-outline" size={28} color={COLORS.red} />
      </View>
      <Text style={styles.emptyTitle}>Could not load applications</Text>
      <Text style={styles.stateText}>
        {current.error?.message ?? "Please try again."}
      </Text>
      <Pressable
        onPress={refresh}
        style={({ pressed }) => [
          styles.retryButton,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Ionicons name="reload-outline" size={15} color="#fff" />
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  ) : (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="people-outline" size={28} color={COLORS.faint} />
      </View>
      <Text style={styles.emptyTitle}>No applications found</Text>
      <Text style={styles.stateText}>
        {search
          ? "No matches for your search. Try a different term."
          : "Try another user type or status filter."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />

      <FlatList
        key={`cols-${columns}`}
        style={styles.list}
        data={showSkeleton ? SKELETON_ITEMS : rows}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.columnWrap : undefined}
        keyExtractor={(item, index) =>
          showSkeleton ? `sk-${item}` : String(getId(item) ?? index)
        }
        renderItem={({ item }) =>
          showSkeleton ? (
            <View style={{ flex: 1 }}>
              <SkeletonCard />
            </View>
          ) : (
            <UserCard
              item={item}
              status={status}
              commercial={commercial}
              onView={setSelectedUser}
              onVerify={(user) => openConfirm("Verified", user)}
              onReject={(user) => openConfirm("Rejected", user)}
            />
          )
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={showSkeleton ? null : listEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={!!current?.isRefetching}
            onRefresh={refresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          wide={wide}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {confirmState && (
        <VerifyConfirmModal
          key={`${confirmState.action}-${getId(confirmState.user)}`}
          wide={wide}
          action={confirmState.action}
          user={confirmState.user}
          loading={verifyMutation.isPending}
          error={verifyMutation.error?.message}
          onCancel={() => setConfirmState(null)}
          onConfirm={({ reason }) =>
            verifyMutation.mutate({
              user: confirmState.user,
              action: confirmState.action,
              reason,
            })
          }
        />
      )}

      {toast && (
        <View
          style={[
            styles.toast,
            wide && styles.toastWide,
            {
              backgroundColor:
                toast.type === "success" ? COLORS.green : COLORS.red,
            },
          ]}
        >
          <Ionicons
            name={
              toast.type === "success" ? "checkmark-circle" : "alert-circle"
            }
            size={18}
            color="#fff"
          />
          <Text style={styles.toastText} numberOfLines={2}>
            {toast.message}
          </Text>
          <Pressable
            onPress={() => setToast(null)}
            hitSlop={8}
            accessibilityLabel="Dismiss"
          >
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  list: { flex: 1, width: "100%", maxWidth: 1180, alignSelf: "center" },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  columnWrap: { gap: 12 },
  cardWrap: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headingIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pageTitle: {
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  pageSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  refreshSpinner: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryLight,
  },

  /* Hero */
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginBottom: 20,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  heroValue: { color: COLORS.ink, fontSize: 20, fontWeight: "800" },
  heroLabel: { color: COLORS.muted, fontSize: 12, marginTop: 1 },

  sectionLabel: {
    color: COLORS.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  /* Chips */
  chipRow: { gap: 8, paddingBottom: 18, paddingRight: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.muted, fontWeight: "700" },
  chipTextActive: { color: "#fff" },

  /* Status cards */
  statusGrid: { flexDirection: "row", gap: 10, marginBottom: 18 },
  statusCard: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  statusIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statusCount: { color: COLORS.ink, fontSize: 18, fontWeight: "800" },
  statusLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },

  /* Toolbar */
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 13,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  searchInput: { flex: 1, color: COLORS.ink, fontSize: 13, paddingVertical: 0 },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
    flexWrap: "wrap",
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },

  /* List heading */
  listHeading: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  listTitle: { color: COLORS.ink, fontSize: 16, fontWeight: "800" },
  listSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  countBadge: {
    minWidth: 32,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: "800" },

  /* User card */
  userCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#101828",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  accentBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "800" },
  cardIdentity: { flex: 1, minWidth: 0 },
  userName: { color: COLORS.ink, fontSize: 14, fontWeight: "800" },
  companyName: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  idRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusChipText: { fontSize: 10, fontWeight: "800" },
  userId: { color: COLORS.faint, fontSize: 10, fontWeight: "600" },
  quickIcons: { flexDirection: "row", gap: 6 },

  infoGrid: {
    backgroundColor: "#F9FAFB",
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 12,
  },
  infoRow: { flexDirection: "row", gap: 8 },
  infoLine: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 9,
    minWidth: 0,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEF0F4",
  },
  infoLabel: { color: COLORS.faint, fontSize: 10, marginBottom: 2 },
  infoValue: { color: COLORS.ink, fontSize: 12, fontWeight: "600" },

  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 12,
    height: 38,
    flexGrow: 1,
  },
  actionText: { fontSize: 12, fontWeight: "800" },

  /* Skeleton */
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: COLORS.line },

  /* Empty / error */
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#EEF0F4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  stateText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  /* Details modal */
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  modalRootWide: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.5)",
  },
  detailSheet: {
    maxHeight: "88%",
    backgroundColor: COLORS.canvas,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  detailSheetWide: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "85%",
    borderRadius: 26,
    paddingTop: 18,
    paddingBottom: 18,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#D0D5DD",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  sheetAvatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetEyebrow: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  sheetTitle: { color: COLORS.ink, fontSize: 18, fontWeight: "800" },
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  detailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
  },
  modalHint: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
    marginBottom: 8,
  },

  /* Confirm modal */
  confirmRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    elevation: 8,
  },
  confirmIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  confirmTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  confirmBody: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  reasonLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  reasonCount: { color: COLORS.faint, fontSize: 10 },
  reasonInput: {
    width: "100%",
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: "#F9FAFB",
    padding: 12,
    color: COLORS.ink,
    fontSize: 13,
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    marginTop: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.redLight,
  },
  inlineErrorText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  cancelText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },
  confirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  confirmButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  /* Toast */
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  toastWide: { left: "50%", right: undefined, width: 420, marginLeft: -210 },
  toastText: { color: "#fff", fontSize: 13, fontWeight: "700", flex: 1 },
});
