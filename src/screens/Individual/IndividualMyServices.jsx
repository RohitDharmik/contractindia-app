// screens/individual/IndividualMyServicesScreen.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useQuery } from "@tanstack/react-query";
import {
  getUserRegistrationbyParam,
  UserServiceDetailsGetbyParam,
} from "../../api/api"; 
import { useAuthStore } from "@/store/authStore";
import { Screen, ScreenHeader } from "../../components";
/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const COLORS = {
  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  primaryLine: "#C7D2FE",
  ink: "#1E293B",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  surface: "#FFFFFF",
  canvas: "#F8FAFC",
  slateLight: "#F1F5F9",
  green: "#059669",
  greenLight: "#ECFDF5",
  greenLine: "#A7F3D0",
  amber: "#B45309",
  amberLight: "#FFFBEB",
  amberLine: "#FDE68A",
  red: "#DC2626",
  redLight: "#FEF2F2",
  redLine: "#FECACA",
};

// One tone per card, cycling, matching the gradient palette on the web.
const TONES = [
  { bg: "#EEF2FF", fg: "#4F46E5" },
  { bg: "#ECFDF5", fg: "#059669" },
  { bg: "#FFFBEB", fg: "#D97706" },
  { bg: "#FDF2F8", fg: "#DB2777" },
  { bg: "#F0F9FF", fg: "#0284C7" },
  { bg: "#FAF5FF", fg: "#9333EA" },
  { bg: "#F7FEE7", fg: "#65A30D" },
  { bg: "#ECFEFF", fg: "#0891B2" },
];

// Category keyword → icon, checked in order against the service name.
const CATEGORY_ICONS = [
  ["consult", "briefcase-outline"],
  ["contract", "construct-outline"],
  ["legal", "scale-outline"],
  ["market", "megaphone-outline"],
  ["asset", "cube-outline"],
  ["brand", "star-outline"],
  ["tender", "layers-outline"],
  ["audit", "shield-checkmark-outline"],
  ["material", "hammer-outline"],
  ["supply", "business-outline"],
];

const iconFor = (name = "") => {
  const lower = name.toLowerCase();
  const hit = CATEGORY_ICONS.find(([key]) => lower.includes(key));
  return hit ? hit[1] : "briefcase-outline";
};

/* ------------------------------------------------------------------ */
/* API helpers                                                         */
/* ------------------------------------------------------------------ */

const unwrapList = (res) => {
  let data = res?.data ?? res ?? [];
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = [];
    }
  }
  return Array.isArray(data) ? data : [];
};

const fetchMyServices = async (userId) =>
  unwrapList(await UserServiceDetailsGetbyParam(`userId=${userId}`));

const fetchRegistration = async (userId) =>
  unwrapList(await getUserRegistrationbyParam(`?userId=${userId}`));

const pick = (o, a, b, d) => o?.[a] ?? o?.[b] ?? d;

const normalizeService = (item, index) => {
  const active = pick(item, "IsActive", "isActive", 0);
  return {
    id: String(pick(item, "ServiceID", "serviceID", index + 1)),
    name: pick(item, "ServiceName", "serviceName", "Service"),
    description: pick(item, "ServiceDescription", "serviceDescription", ""),
    isActive: active === 1 || active === true || active === "1",
    raw: item,
  };
};

const valueOr = (v) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

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

function ServiceCard({ service, index, pending, onEnquire }) {
  const tone = TONES[index % TONES.length];
  const enabled = service.isActive;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: tone.bg }]}>
          <Ionicons name={iconFor(service.name)} size={20} color={tone.fg} />
        </View>
        {enabled ? (
          <View style={styles.badgeActive}>
            <Ionicons name="checkmark-circle" size={12} color={COLORS.green} />
            <Text style={[styles.badgeText, { color: COLORS.green }]}>
              Active
            </Text>
          </View>
        ) : (
          <View style={styles.badgeExpired}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.amber} />
            <Text style={[styles.badgeText, { color: COLORS.amber }]}>
              Expired
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {service.name}
        </Text>
        {!!service.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {service.description}
          </Text>
        )}
      </View>

      <Pressable
        onPress={() => onEnquire(service)}
        disabled={!enabled || pending}
        accessibilityRole="button"
        accessibilityLabel={`Enquire about ${service.name}`}
        style={({ pressed }) => [
          styles.enquireBtn,
          enabled ? { backgroundColor: tone.fg } : styles.enquireDisabled,
          pressed && enabled && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
      >
        {pending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons
            name={enabled ? "call-outline" : "lock-closed-outline"}
            size={15}
            color={enabled ? "#fff" : COLORS.muted}
          />
        )}
        <Text style={[styles.enquireText, !enabled && { color: COLORS.muted }]}>
          {pending
            ? "Retrieving details…"
            : enabled
              ? "Enquire now"
              : "Unavailable"}
        </Text>
        {!pending && enabled && (
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        )}
      </Pressable>
    </View>
  );
}

function DetailTile({ icon, label, value }) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={14} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.tileValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function EnquirySheet({ enquiry, onClose }) {
  const user = enquiry?.user ?? {};
  const name = pick(user, "Name", "name", "");
  const email = pick(user, "EmailId", "emailId", "");
  const mobile = pick(user, "MobileNo", "mobileNo", "");
  const state = pick(user, "StateName", "stateName", "");
  const pin = pick(user, "PinCode", "pinCode", "");

  return (
    <Modal
      visible={!!enquiry}
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
              <Ionicons name="mail-outline" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.sheetEyebrow}>SERVICE DETAILS</Text>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {enquiry?.service?.name}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={COLORS.ink} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.sheetBody}>
            <View style={styles.lockNote}>
              <Ionicons
                name="lock-closed-outline"
                size={13}
                color={COLORS.muted}
              />
              <Text style={styles.lockNoteText}>
                These details come from your registration and are read-only.
              </Text>
            </View>

            <View style={styles.tileGrid}>
              <DetailTile
                icon="person-outline"
                label="Full name"
                value={valueOr(name)}
              />
              <DetailTile
                icon="call-outline"
                label="Mobile"
                value={valueOr(mobile)}
              />
              <DetailTile
                icon="mail-outline"
                label="Email"
                value={valueOr(email)}
              />
              <DetailTile
                icon="map-outline"
                label="State"
                value={valueOr(state)}
              />
              <DetailTile
                icon="location-outline"
                label="Pin code"
                value={valueOr(pin)}
              />
            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.primaryText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function IndividualMyServicesScreen( ) {
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 3 : width >= 640 ? 2 : 1;

  const loginResponce = useAuthStore((s) => s?.user);
  const userId = loginResponce?.userId || 0;

  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [enquiry, setEnquiry] = useState(null); // { service, user }
  const [toast, setToast] = useState(null);

  const showToast = useCallback(
    (type, message) => setToast({ type, message, key: Date.now() }),
    [],
  );
  const hideToast = useCallback(() => setToast(null), []);

  /* ── Fetch services ── */
  const {
    data: rawServices,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["userservicesdetails", userId],
    queryFn: () => fetchMyServices(userId),
    enabled: !!userId,
    retry: false,
  });

  const services = useMemo(
    () => (rawServices ?? []).map(normalizeService),
    [rawServices],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        String(s.description).toLowerCase().includes(term),
    );
  }, [services, search]);

  /* ── Enquire: load registration details, then open the sheet ── */
  const handleEnquire = useCallback(
    async (service) => {
      if (!userId) {
        showToast("error", "Please log in to enquire about this service.");
        return;
      }
      setPendingId(service.id);
      try {
        const list = await fetchRegistration(userId);
        setEnquiry({ service, user: list[0] ?? {} });
      } catch {
        showToast("error", "Could not load your registration details.");
        setEnquiry({ service, user: {} });
      } finally {
        setPendingId(null);
      }
    },
    [userId, showToast],
  );

  /* ── List header: search, count, notices ── */
  const listHeader = (
    <View style={styles.listHead}>
      {isError && !isLoading && (
        <View style={styles.noticeBanner}>
          <Ionicons name="flash-outline" size={16} color={COLORS.amber} />
          <Text style={styles.noticeText} numberOfLines={2}>
            Live services are unavailable right now.
          </Text>
        </View>
      )}

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.faint} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search services…"
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
        <View style={styles.countPill}>
          <Ionicons name="layers-outline" size={13} color={COLORS.primary} />
          <Text style={styles.countText}>
            {isLoading
              ? "…"
              : `${filtered.length} service${filtered.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
      </View>
    </View>
  );

  const emptyState = isLoading ? (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.stateText}>Loading services…</Text>
    </View>
  ) : (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="briefcase-outline" size={26} color={COLORS.faint} />
      </View>
      <Text style={styles.stateTitle}>No services found</Text>
      <Text style={styles.stateText}>
        {search
          ? "Try a different search term."
          : "Services will appear here once they are available."}
      </Text>
      {!!search && (
        <Pressable onPress={() => setSearch("")} style={styles.clearLink}>
          <Ionicons name="close" size={12} color={COLORS.primary} />
          <Text style={styles.clearLinkText}>Clear search</Text>
        </Pressable>
      )}
    </View>
  );
  return (
    <Screen>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />

      <ScreenHeader
       title="My Services"
        subtitle="Browse services and enquire with our team"
        icon="briefcase"
        showBack
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh services"
            onPress={() => refetch()}
            disabled={isFetching}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.ink} />
          </Pressable>
        }
      />
   

      <FlatList
        key={`cols-${columns}`}
        data={isLoading ? [] : filtered}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.colWrap : undefined}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={columns > 1 ? styles.half : null}>
            <ServiceCard
              service={item}
              index={index}
              pending={pendingId === item.id}
              onEnquire={handleEnquire}
            />
          </View>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => refetch()}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      <EnquirySheet enquiry={enquiry} onClose={() => setEnquiry(null)} />

      <Toast toast={toast} onHide={hideToast} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: { paddingHorizontal: 14, paddingBottom: 32, flexGrow: 1 },
  colWrap: { gap: 12 },
  half: { flex: 1 },

  /* List header */
  listHead: { paddingTop: 12, gap: 12, marginBottom: 4 },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.amberLight,
    borderWidth: 1,
    borderColor: COLORS.amberLine,
  },
  noticeText: { flex: 1, color: COLORS.amber, fontSize: 12, fontWeight: "700" },

  toolbar: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchWrap: {
    flex: 1,
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
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryLine,
  },
  countText: { color: COLORS.primary, fontSize: 12, fontWeight: "800" },

  /* Card */
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    elevation: 1,
    gap: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.greenLine,
  },
  badgeExpired: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.amberLight,
    borderWidth: 1,
    borderColor: COLORS.amberLine,
  },
  badgeText: { fontSize: 11, fontWeight: "800" },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  cardDesc: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },

  enquireBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 13,
  },
  enquireDisabled: {
    backgroundColor: COLORS.slateLight,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  enquireText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  /* Empty / loading */
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 6,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.slateLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  stateTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  stateText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  clearLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  clearLinkText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },

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
  sheetEyebrow: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  sheetTitle: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 2,
  },
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },

  lockNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.slateLight,
  },
  lockNoteText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },

  tileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  tileIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    color: COLORS.faint,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tileValue: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "800" },

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
