// screens/individual/CompanySubServicesScreen.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  CheckValidityGet,
  getUserRegistrationbyParam,
  planMasterGetById,
  ServiceMenuGet,
  UserPaymentHistorySave,
  UserServiceDetailsSave,
  UserSubscriptionDetailGet,
  userServicesdetailsGetByParam,
  userSubscriptionDetailSave,
} from "../../api/api";
import { useAuthStore } from "@/store/authStore";
import ScreenHeader from "../../components/ScreenHeader";
import { openRazorpay } from "../../utils/razorpayCheckout";
import { useNavigation } from "@react-navigation/native";
import { useCategoryStore } from "../../store/categoryStore";
// import AppHeader from "../../components/common/AppHeader";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

// Set these in your .env file (Expo loads EXPO_PUBLIC_* automatically).
const API_URL = process.env.EXPO_PUBLIC_API_URL || "";
const RAZORPAY_KEY =
  process.env.EXPO_PUBLIC_RAZORPAY_KEY || "rzp_test_TBIngVA6fjYaLH";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop",
];

/* ------------------------------------------------------------------ */
/* Design tokens (matches the web palette)                             */
/* ------------------------------------------------------------------ */

const COLORS = {
  primary: "#4F46E5",
  brand: "#492A78",
  ink: "#0F172A",
  slate: "#1E293B",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  surface: "#FFFFFF",
  canvas: "#F8FAFC",
  indigoLight: "#EEF2FF",
  indigoLine: "#C7D2FE",
  green: "#059669",
  greenLight: "#ECFDF5",
  greenLine: "#A7F3D0",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  amberLine: "#FDE68A",
  red: "#DC2626",
  redLight: "#FEF2F2",
  redLine: "#FECACA",
  slateLight: "#F1F5F9",
};

const PALETTE = [
  {
    activeBg: "#4f46e5",
    softBg: "#eef2ff",
    softText: "#4338ca",
    dot: "#6366f1",
  },
  {
    activeBg: "#0e7490",
    softBg: "#ecfeff",
    softText: "#0e7490",
    dot: "#0891b2",
  },
  {
    activeBg: "#047857",
    softBg: "#ecfdf5",
    softText: "#047857",
    dot: "#059669",
  },
  {
    activeBg: "#b45309",
    softBg: "#fffbeb",
    softText: "#b45309",
    dot: "#d97706",
  },
  {
    activeBg: "#be123c",
    softBg: "#fff1f2",
    softText: "#be123c",
    dot: "#e11d48",
  },
  {
    activeBg: "#6d28d9",
    softBg: "#f5f3ff",
    softText: "#6d28d9",
    dot: "#7c3aed",
  },
];
const col = (depth) => PALETTE[depth % PALETTE.length];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const unwrap = (res) => {
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

const normalizeServiceMenu = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.items)) return payload.items;
  if (payload && typeof payload === "object") {
    const nested = Object.values(payload).find((v) => Array.isArray(v));
    if (nested) return nested;
  }
  return [];
};

// Indian digit grouping (12,34,567) without relying on Intl in Hermes.
const formatINR = (value) => {
  const n = Math.round(Number(value) || 0);
  const s = String(n);
  if (s.length <= 3) return `₹${s}`;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `₹${rest},${last3}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD MMM YYYY") : String(value);
};

const callNumber = (num) => {
  if (!num) return;
  Linking.openURL(`tel:${String(num).replace(/\s+/g, "")}`).catch(() => {});
};

const buildTree = (flat) => {
  if (!Array.isArray(flat) || !flat.length) return [];
  const map = {};
  flat.forEach((item) => {
    map[item?.ServiceID] = { ...item, children: [] };
  });
  const roots = [];
  flat.forEach((item) => {
    const pid = item?.ParentServiceID ?? 0;
    const node = map[item?.ServiceID];
    if (!pid || !map[pid]) roots.push(node);
    else map[pid].children.push(node);
  });
  return roots;
};

const flattenTree = (nodes, out = []) => {
  nodes.forEach((n) => {
    out.push(n);
    if (n.children?.length) flattenTree(n.children, out);
  });
  return out;
};

const findNode = (nodes, id) => {
  for (const n of nodes) {
    if (n.ServiceID === id) return n;
    const found = findNode(n.children ?? [], id);
    if (found) return found;
  }
  return null;
};

const findFirstLeaf = (node) => {
  if (!node?.children?.length) return node;
  return findFirstLeaf(node.children[0]);
};

// Every ancestor of targetId (not including targetId itself).
const getAncestorIds = (tree, targetId) => {
  const path = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      path.push(n.ServiceID);
      if (n.ServiceID === targetId) return true;
      if (walk(n.children ?? [])) return true;
      path.pop();
    }
    return false;
  };
  walk(tree);
  return new Set(path.filter((id) => id !== targetId));
};

const subtreeHasActive = (node, activeId) => {
  if (!activeId) return false;
  if (node?.ServiceID === activeId) return true;
  return (node?.children ?? []).some((c) => subtreeHasActive(c, activeId));
};

/* ------------------------------------------------------------------ */
/* API helpers                                                         */
/* ------------------------------------------------------------------ */

const fetchMenu = async () => normalizeServiceMenu(await ServiceMenuGet());

const fetchContractors = async (serviceId) => {
  if (!serviceId) return [];
  return unwrap(
    await userServicesdetailsGetByParam(
      `serviceId=${serviceId}&userId=${0}&userType=2`,
    ),
  );
};

const fetchSubscriptions = async (userId) =>
  unwrap(await UserSubscriptionDetailGet(`userId=${userId}`));

const checkValidity = async (userId) => CheckValidityGet(`userId=${userId}`);

const fetchPlans = async (userType) =>
  unwrap(await planMasterGetById(`userType=${userType}`));

const fetchRegistration = async (userId) =>
  unwrap(await getUserRegistrationbyParam(`?userId=${userId}`));

/* ------------------------------------------------------------------ */
/* Shared UI pieces                                                    */
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

function Btn({
  label,
  icon,
  onPress,
  variant = "ghost",
  disabled,
  loading,
  flex = 1,
}) {
  const bg = {
    primary: COLORS.primary,
    dark: COLORS.ink,
    success: COLORS.green,
    ghost: COLORS.surface,
  }[variant];
  const filled = variant !== "ghost";
  const tint = filled ? "#fff" : COLORS.slate;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.btn,
        { flex, backgroundColor: bg },
        !filled && { borderWidth: 1, borderColor: COLORS.line },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tint} />
      ) : icon ? (
        <Ionicons name={icon} size={15} color={tint} />
      ) : null}
      <Text style={[styles.btnText, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

function Sheet({
  visible,
  onClose,
  dismissable = true,
  icon = "information-circle-outline",
  title,
  subtitle,
  footer,
  children,
  maxHeight = "90%",
}) {
  const handleClose = () => {
    if (dismissable) onClose?.();
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.sheetRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.sheet, { maxHeight }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHead}>
            <View style={styles.sheetIcon}>
              <Ionicons name={icon} size={18} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {title}
              </Text>
              {!!subtitle && (
                <Text style={styles.sheetSub} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
            {dismissable && (
              <Pressable
                onPress={handleClose}
                hitSlop={8}
                style={styles.closeBtn}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={18} color={COLORS.slate} />
              </Pressable>
            )}
          </View>
          <View style={styles.sheetContent}>{children}</View>
          {!!footer && <View style={styles.sheetFooter}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Category tree (sidebar on tablets, sheet on phones)                 */
/* ------------------------------------------------------------------ */

function TreeRow({ node, depth, activeId, expandedIds, onSelect, onToggle }) {
  const hasKids = (node.children?.length ?? 0) > 0;
  const isActive = node.ServiceID === activeId;
  const isOpen = expandedIds.has(node.ServiceID);
  const isAncestor = !isActive && subtreeHasActive(node, activeId);
  const c = col(depth);
  const fontSize = Math.max(12, 13 - depth * 0.5);
  const dot = Math.max(6, 9 - depth);

  return (
    <View>
      <Pressable
        onPress={() => {
          onSelect(node);
          if (hasKids) onToggle(node.ServiceID);
        }}
        accessibilityRole="button"
        accessibilityLabel={node.ServiceName}
        style={({ pressed }) => [
          styles.treeRow,
          {
            marginLeft: depth * 14,
            backgroundColor: isActive
              ? c.activeBg
              : isAncestor
                ? c.softBg
                : "transparent",
          },
          pressed && { opacity: 0.8 },
        ]}
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
            styles.treeText,
            {
              fontSize,
              color: isActive ? "#fff" : isAncestor ? c.softText : "#475569",
            },
          ]}
        >
          {node.ServiceName}
        </Text>
        {hasKids && (
          <Ionicons
            name={isOpen ? "chevron-down" : "chevron-forward"}
            size={14}
            color={isActive ? "rgba(255,255,255,0.85)" : COLORS.faint}
          />
        )}
      </Pressable>

      {hasKids &&
        isOpen &&
        node.children.map((child) => (
          <TreeRow
            key={child.ServiceID}
            node={child}
            depth={depth + 1}
            activeId={activeId}
            expandedIds={expandedIds}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
    </View>
  );
}

function Breadcrumb({ tree, activeId, onSelect }) {
  const path = useMemo(() => {
    const trail = [];
    const walk = (nodes) => {
      for (const n of nodes) {
        trail.push(n);
        if (n.ServiceID === activeId) return true;
        if (walk(n.children ?? [])) return true;
        trail.pop();
      }
      return false;
    };
    walk(tree);
    return trail;
  }, [tree, activeId]);

  if (path.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={styles.crumbRow}
    >
      {path.map((node, i) => {
        const last = i === path.length - 1;
        const c = col(i);
        return (
          <View key={node.ServiceID} style={styles.crumbItem}>
            {i > 0 && (
              <Ionicons name="chevron-forward" size={11} color={COLORS.faint} />
            )}
            <Pressable
              disabled={last}
              onPress={() => onSelect(node)}
              style={[styles.crumbChip, last && { backgroundColor: c.softBg }]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.crumbText,
                  { color: last ? c.softText : COLORS.faint },
                ]}
              >
                {node.ServiceName}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/* Membership card                                                     */
/* ------------------------------------------------------------------ */

function MembershipCard({ hasActivePlan, activeSub, onAction }) {
  return (
    <View
      style={[
        styles.member,
        hasActivePlan ? styles.memberOn : styles.memberOff,
      ]}
    >
      <View
        style={[
          styles.memberIcon,
          { backgroundColor: hasActivePlan ? "#EDE9FE" : COLORS.amberLight },
        ]}
      >
        <Ionicons
          name={hasActivePlan ? "ribbon" : "alert-circle"}
          size={18}
          color={hasActivePlan ? COLORS.brand : COLORS.amber}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[
            styles.memberEyebrow,
            { color: hasActivePlan ? COLORS.muted : COLORS.amber },
          ]}
        >
          {hasActivePlan ? "Active membership" : "Membership required"}
        </Text>
        <Text style={styles.memberTitle} numberOfLines={1}>
          {hasActivePlan ? (activeSub?.PlanName ?? "Plan") : "No active plan"}
        </Text>
        <Text style={styles.memberSub} numberOfLines={2}>
          {hasActivePlan
            ? `Expires on ${activeSub?.ExpiryDate ?? "—"}`
            : "Purchase a plan to unlock contractor details"}
        </Text>
      </View>
      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.memberBtn,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.memberBtnText}>
          {hasActivePlan ? "Upgrade" : "Buy plan"}
        </Text>
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Contractor card                                                     */
/* ------------------------------------------------------------------ */

function ContractorCard({ item, idx, onView, disabled }) {
  const [imgFailed, setImgFailed] = useState(false);

  const company = item?.CompanyName || item?.Name || "Contractor";
  const location = item?.CityName || item?.StateName || "India";
  const phone = item?.MobileNo || item?.PhoneNo || "";
  const status = item?.Status || "";
  const rating =
    typeof item?.Rating === "number" ? item.Rating : 4.5 + (idx % 5) * 0.1;
  const fallback = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
  const remote = API_URL
    ? `${API_URL}/UserDocumentStore/image?userId=${item?.UserID}&documentCategoryId=7&documentSubCategoryId=10`
    : null;
  const source = { uri: remote && !imgFailed ? remote : fallback };
  const viewed = Number(item?.IsActive) === 1;

  return (
    <View style={styles.cCard}>
      <View style={styles.cImageWrap}>
        <Image
          source={source}
          style={styles.cImage}
          onError={() => setImgFailed(true)}
        />
        <View style={styles.cShade} />

        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={10} color="#FACC15" />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>

        {!!status && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  status === "Approved"
                    ? "rgba(16,185,129,0.92)"
                    : "rgba(251,191,36,0.92)",
              },
            ]}
          >
            <Text style={styles.statusBadgeText}>{status}</Text>
          </View>
        )}
      </View>

      <View style={styles.cBody}>
        <Text style={styles.cName} numberOfLines={1}>
          {company}
        </Text>
        <View style={styles.cLocRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.faint} />
          <Text style={styles.cLoc} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <View style={styles.cActions}>
          <Pressable
            onPress={() => onView(item)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={viewed ? "Viewed" : "View details"}
            style={({ pressed }) => [
              styles.viewBtn,
              { backgroundColor: viewed ? COLORS.ink : COLORS.amber },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              disabled && { opacity: 0.5 },
            ]}
          >
            <Ionicons
              name={viewed ? "checkmark-circle-outline" : "eye-outline"}
              size={14}
              color="#fff"
            />
            <Text style={styles.viewBtnText}>
              {viewed ? "Viewed" : "View details"}
            </Text>
          </Pressable>

          {!!phone && !!item?.IsActive && (
            <Pressable
              onPress={() => callNumber(phone)}
              accessibilityRole="button"
              accessibilityLabel="Call contractor"
              style={({ pressed }) => [
                styles.callBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="call-outline" size={14} color={COLORS.green} />
              <Text style={styles.callBtnText}>Call</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function CardSkeleton() {
  return (
    <View style={[styles.cCard, { opacity: 0.6 }]}>
      <View style={[styles.cImageWrap, { backgroundColor: COLORS.slateLight }]} />
      <View style={styles.cBody}>
        <View style={[styles.skel, { width: "70%" }]} />
        <View style={[styles.skel, { width: "45%", marginTop: 8, marginBottom: 12 }]} />
        <View style={[styles.skel, { height: 38 }]} />
      </View>
    </View>
  );
}
/* ------------------------------------------------------------------ */
/* Plan card and sheets                                                */
/* ------------------------------------------------------------------ */

function PlanCard({ plan, busy, onSelect }) {
  const price = Number(plan?.Price || 0);
  const free = price === 0;
  const active = Number(plan?.IsActive) === 1;

  return (
    <View style={styles.planCard}>
      <View style={styles.planTop}>
        <Text style={styles.planName} numberOfLines={1}>
          {plan?.PlanName}
        </Text>
        {active && (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Active</Text>
          </View>
        )}
      </View>

      <Text style={styles.planPrice}>{free ? "Free" : formatINR(price)}</Text>
      <Text style={styles.planPer}>
        {free
          ? "No payment required"
          : `per ${(plan?.DurationType || "month").toLowerCase()}`}
      </Text>

      <View style={styles.bulletRow}>
        <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
        <Text style={styles.bulletText}>
          Up to {plan?.maxNoofServices ?? "unlimited"} services
        </Text>
      </View>
      <View style={styles.bulletRow}>
        <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
        <Text style={styles.bulletText} numberOfLines={2}>
          {plan?.Remark || "Full access"}
        </Text>
      </View>

      <Btn
        label={free ? "Activate free plan" : "Select plan"}
        icon={free ? "gift-outline" : "card-outline"}
        variant="primary"
        onPress={() => onSelect(plan)}
        loading={busy}
        disabled={busy}
        flex={0}
      />
    </View>
  );
}

function DetailTile({ icon, label, value, tone }) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={14} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text
          style={[styles.tileValue, tone && { color: tone }]}
          numberOfLines={2}
        >
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}

 

const contractorName = (c) => c?.CompanyName || c?.Name || "Contractor";
const contractorPhone = (c) => c?.MobileNo || c?.PhoneNo || "";
/* ------------------------------------------------------------------ */
/* Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function CompanySubServices({ serviceId, serviceName }) {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const columns = isTablet ? (width >= 1200 ? 3 : 2) : width >= 600 ? 2 : 1;

  const loginResponce = useAuthStore((s) => s?.user);
  const isLoggedIn = !!(loginResponce?.isLoginSuccessful || loginResponce?.userId);
  const userId = loginResponce?.userId || 0;
  const userType = loginResponce?.userType || 0;

  // Shared with the drawer sidebar.
  const activeId = useCategoryStore((s) => s.activeId);
  const selectCategory = useCategoryStore((s) => s.select);

  const [companyUserID, setCompanyUserID] = useState(0);
  const [plansOpen, setPlansOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [pendingItem, setPendingItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // Contractor the user tapped before having a plan; opened after purchase.
  const intentRef = useRef(null);

  const showToast = useCallback(
    (type, message) => setToast({ type, message, key: Date.now() }),
    [],
  );
  const hideToast = useCallback(() => setToast(null), []);

  /* ── Category data ── */
  const menuQuery = useQuery({
    queryKey: ["ServiceMenuGetList"],
    queryFn: fetchMenu,
    staleTime: 5 * 60 * 1000,
  });
  const fullTree = useMemo(() => buildTree(menuQuery.data ?? []), [menuQuery.data]);
  const totalNodes = useMemo(() => flattenTree(fullTree).length, [fullTree]);
  const activeNode = useMemo(
    () => (activeId ? findNode(fullTree, activeId) : null),
    [fullTree, activeId],
  );

  const parentName = useMemo(() => {
    const s = (menuQuery.data ?? []).find(
      (el) => Number(el.ServiceID ?? el.value) === Number(serviceId),
    );
    return s?.ServiceName || s?.name || serviceName || "Services";
  }, [menuQuery.data, serviceId, serviceName]);

  // Keep the shared store in sync with the route.
  useEffect(() => {
    if (!fullTree.length) return;

    if (serviceId && findNode(fullTree, Number(serviceId))) {
      const id = Number(serviceId);
      selectCategory(id, [...getAncestorIds(fullTree, id)]);
      return;
    }

    const current = useCategoryStore.getState().activeId;
    if (current && findNode(fullTree, current)) return;

    const leaf = findFirstLeaf(fullTree[0]);
    selectCategory(leaf.ServiceID, [...getAncestorIds(fullTree, leaf.ServiceID)]);
  }, [fullTree, serviceId, selectCategory]);

  /* ── Account state ── */
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
  const subs = subsQuery.data ?? [];
  const activeSub = subs.find((s) => Number(s?.IsActive) === 1) ?? null;
  const hasActivePlan = !!validityQuery.data?.status;

  const plansQuery = useQuery({
    queryKey: ["planMasterGetById", userType],
    queryFn: () => fetchPlans(userType),
    enabled: !!userType && plansOpen,
    retry: 1,
  });
  const plans = plansQuery.data ?? [];

  /* ── Contractors ── */
  const contractorsQuery = useQuery({
    queryKey: ["contractors", activeId],
    queryFn: () => fetchContractors(activeId),
    enabled: !!activeId,
    staleTime: 2 * 60 * 1000,
  });
  const contractors = useMemo(() => contractorsQuery.data ?? [], [contractorsQuery.data]);

  const filtered = useMemo(() => {
    const target = Number(activeId ?? serviceId ?? 0);
    if (!target) return contractors;
    return contractors.filter((c) => Number(c?.ServiceID) === target);
  }, [contractors, activeId, serviceId]);

  const contractorsLoading = contractorsQuery.isLoading && !!activeId;

  /* ── Actions ── */
  const refreshAccess = useCallback(async () => {
    await Promise.all([subsQuery.refetch(), validityQuery.refetch()]);
  }, [subsQuery, validityQuery]);

  const openDetail = useCallback(
    async (item) => {
      setBusy(true);
      try {
        const list = await fetchRegistration(item?.UserID);
        setDetailItem(list[0] ?? { ...item });
      } catch {
        showToast("error", "Failed to retrieve registration details.");
        setDetailItem({ ...item });
      } finally {
        setBusy(false);
      }
    },
    [showToast],
  );

  const handleViewDetails = (item) => {
    setCompanyUserID(item?.UserID);

    if (!isLoggedIn) {
      showToast("error", "Please login to view contractor details");
      navigation.navigate("Login");
      return;
    }

    if (!hasActivePlan) {
      intentRef.current = item;
      setPlansOpen(true);
      return;
    }

    if (Number(item?.IsActive) === 1) {
      openDetail(item);
      return;
    }

    setPendingItem(item);
  };

  const confirmPending = async () => {
    const item = pendingItem;
    if (!item) return;
    setBusy(true);
    try {
      const res = await UserServiceDetailsSave({
        userServiceID: 0,
        userID: userId,
        serviceID: activeNode?.ServiceID ?? serviceId ?? 0,
        serviceName: activeNode?.ServiceName || parentName || "Service",
        planID: activeSub?.PlanID ?? 0,
        planName: activeSub?.PlanName ?? "",
        amount: 0,
        enterredBy: userId,
        isActive: 1,
        CompanyUserID: item?.UserID,
      });
      if (!res?.status) {
        throw new Error(res?.message || "Failed to activate service. Please try again.");
      }

      setPendingItem(null);
      showToast("success", res?.message || "Service activated successfully");
      contractorsQuery.refetch();
      subsQuery.refetch();
      await openDetail(item);
    } catch (err) {
      showToast("error", err?.message || "Failed to activate service. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const activateFreePlan = async (plan) => {
    setBusy(true);
    try {
      const res = await userSubscriptionDetailSave({
        userSubscriptionID: 0,
        userID: userId,
        planID: plan.PlanID,
        planName: plan.PlanName || "",
        remark: plan.Remark || "",
        enterredBy: userId,
        isActive: 1,
        CompanyUserID: companyUserID,
      });
      if (!res?.status) throw new Error(res?.message || "Failed to activate plan");

      showToast("success", "Plan activated successfully");
      setPlansOpen(false);
      await refreshAccess();

      const intent = intentRef.current;
      intentRef.current = null;
      if (intent) await openDetail(intent);
    } catch (err) {
      showToast("error", err?.message || "Failed to activate plan");
    } finally {
      setBusy(false);
    }
  };

  const handleSelectPlan = (plan) => {
    if (Number(plan?.Price) === 0) {
      activateFreePlan(plan);
      return;
    }
    setPaymentPlan(plan);
  };

  const handlePay = async () => {
    const plan = paymentPlan;
    if (!plan) return;
    setBusy(true);
    try {
      // Step 1: inactive subscription so there is a record to activate.
      const subRes = await userSubscriptionDetailSave({
        userSubscriptionID: 0,
        userID: userId,
        planID: plan.PlanID,
        planName: plan.PlanName || "",
        remark: plan.Remark || "",
        enterredBy: userId,
        isActive: 0,
        CompanyUserID: companyUserID,
      });
      if (!subRes?.status) throw new Error(subRes?.message || "Failed to prepare subscription");

      // Step 2: platform-specific Razorpay checkout.
      const payment = await openRazorpay({
        key: RAZORPAY_KEY,
        amount: Math.round(Number(plan.Price || 0) * 100),
        currency: "INR",
        name: "Contracts India",
        description: plan.PlanName,
        prefill: {
          name: loginResponce?.userName || "",
          email: loginResponce?.emailId || "",
          contact: loginResponce?.mobileNo || "",
        },
        theme: { color: "#4f46e5" },
      });

      // Step 3: record payment, then activate.
      const histRes = await UserPaymentHistorySave({
        userID: userId,
        TransactionID: payment?.razorpay_payment_id ?? "",
        payment: plan.Price ?? 0,
        paymentStatus: "Success",
        paymentMode: "Card",
        remark: plan.PlanName ?? "",
        enterredBy: userId,
        enterDate: new Date().toISOString(),
        TransactionDate: new Date().toISOString(),
        isActive: 1,
      });
      if (histRes?.status === false) {
        throw new Error(histRes?.message || "Failed to save payment history");
      }

      const activateRes = await userSubscriptionDetailSave({
        userSubscriptionID: 0,
        userID: userId,
        planID: plan.PlanID,
        planName: plan.PlanName || "",
        remark: plan.Remark || "",
        enterredBy: userId,
        isActive: 1,
        CompanyUserID: companyUserID,
      });
      if (!activateRes?.status) {
        throw new Error("Payment received but activation failed. Please contact support.");
      }

      setPaymentPlan(null);
      setPlansOpen(false);
      await refreshAccess();
      showToast("success", "Payment successful! Your plan is now active.");

      const intent = intentRef.current;
      intentRef.current = null;
      if (intent) await openDetail(intent);
    } catch (err) {
      // Razorpay reports a cancelled checkout with code 0.
      if (err?.code === 0) showToast("error", "Payment cancelled");
      else showToast("error", err?.description || err?.message || "Error processing payment");
    } finally {
      setBusy(false);
    }
  };

  const closePlans = () => {
    if (busy) return;
    setPlansOpen(false);
    setPaymentPlan(null);
    intentRef.current = null;
  };

  const closePayment = () => {
    if (!busy) setPaymentPlan(null);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleCrumbSelect = (node) => {
    selectCategory(node.ServiceID, [...getAncestorIds(fullTree, node.ServiceID)]);
    navigation.setParams({ serviceId: node.ServiceID, serviceName: node.ServiceName });
  };

  /* ── Render pieces ── */
  const headerActions = [
    {
      icon: "menu-outline",
      label: "Categories",
      onPress: () => navigation.openDrawer(),
    },
  ];

  const listHeader = (
    <View style={styles.listHead}>
      {isLoggedIn && (
        <MembershipCard
          hasActivePlan={hasActivePlan}
          activeSub={activeSub}
          onAction={() => setPlansOpen(true)}
        />
      )}

      <Breadcrumb tree={fullTree} activeId={activeId} onSelect={handleCrumbSelect} />

      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>
          {activeNode?.ServiceName ?? "Select a category"}
        </Text>
        {!contractorsLoading && !!activeId && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const emptyState = contractorsLoading ? (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.stateText}>Loading specialists…</Text>
    </View>
  ) : (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="business-outline" size={28} color={COLORS.faint} />
      </View>
      <Text style={styles.stateTitle}>
        {activeId ? "No specialists found" : "Select a category"}
      </Text>
      <Text style={styles.stateText}>
        {activeId ? "Try a different category." : "Open the menu to choose a category."}
      </Text>
    </View>
  );

  const loadingGrid = Array.from({ length: columns * 2 }, (_, i) => ({ id: `sk-${i}` }));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />

      <ScreenHeader
        title={parentName}
        subtitle={`${totalNodes} categories`}
        icon="business"
        showBack={handleBack}
        actions={headerActions}
      />

      <FlatList
        key={`grid-${columns}`}
        style={{ flex: 1 }}
        data={contractorsLoading ? loadingGrid : filtered}
        numColumns={columns}
        keyExtractor={(item, i) => String(item?.UserID ?? item?.id ?? i)}
        renderItem={({ item, index }) => (
          <View style={styles.gridItem}>
            {contractorsLoading ? (
              <CardSkeleton />
            ) : (
              <ContractorCard item={item} idx={index} onView={handleViewDetails} disabled={busy} />
            )}
          </View>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={contractorsQuery.isFetching && !contractorsQuery.isLoading}
            onRefresh={() => contractorsQuery.refetch()}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      {/* Confirm viewing details */}
      <Sheet
        visible={!!pendingItem}
        onClose={() => setPendingItem(null)}
        dismissable={!busy}
        icon="eye-outline"
        title="View service details"
        subtitle="Confirm your request"
        maxHeight="60%"
        footer={
          <>
            <Btn
              label="Cancel"
              icon="close-outline"
              onPress={() => setPendingItem(null)}
              disabled={busy}
            />
            <Btn
              label="Yes, view details"
              icon="checkmark"
              variant="primary"
              onPress={confirmPending}
              loading={busy}
              disabled={busy}
            />
          </>
        }
      >
        <View style={{ padding: 18 }}>
          <Text style={styles.confirmText}>
            Are you sure you want to view details for{" "}
            <Text style={{ fontWeight: "800", color: COLORS.ink }}>
              {pendingItem ? contractorName(pendingItem) : "this contractor"}
            </Text>
            ?
          </Text>
        </View>
      </Sheet>

      {/* Plan selection */}
      <Sheet
        visible={plansOpen}
        onClose={closePlans}
        dismissable={!busy}
        icon="ribbon-outline"
        title="Choose a plan"
        subtitle="No hidden fees. Cancel anytime."
        maxHeight="88%"
      >
        {plansQuery.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>No plans available</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
            {plans.map((plan) => (
              <PlanCard
                key={String(plan.PlanID)}
                plan={plan}
                busy={busy}
                onSelect={handleSelectPlan}
              />
            ))}
          </ScrollView>
        )}
      </Sheet>

      {/* Payment confirmation */}
      <Sheet
        visible={!!paymentPlan}
        onClose={closePayment}
        dismissable={!busy}
        icon="shield-checkmark-outline"
        title="Confirm payment"
        subtitle="Subscribe to access contractor details"
        maxHeight="75%"
        footer={
          <>
            <Btn label="Cancel" icon="close-outline" onPress={closePayment} disabled={busy} />
            <Btn
              label={
                Number(paymentPlan?.Price) === 0
                  ? "Activate"
                  : `Pay ${formatINR(paymentPlan?.Price)}`
              }
              icon="card-outline"
              variant="primary"
              onPress={handlePay}
              loading={busy}
              disabled={busy}
            />
          </>
        }
      >
        <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
          <View style={styles.summary}>
            <Text style={styles.summaryEyebrow}>PLAN SUMMARY</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plan</Text>
              <Text style={styles.summaryValue}>{paymentPlan?.PlanName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{paymentPlan?.DurationType || "—"}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryLabel}>Total amount</Text>
              <Text style={styles.summaryTotalValue}>{formatINR(paymentPlan?.Price)}</Text>
            </View>
          </View>

          <View style={styles.secureNote}>
            <Ionicons name="lock-closed-outline" size={14} color={COLORS.muted} />
            <Text style={styles.secureText}>
              Secure payment powered by Razorpay. Your data is encrypted.
            </Text>
          </View>
        </ScrollView>
      </Sheet>

      {/* Contractor details */}
      <Sheet
        visible={!!detailItem}
        onClose={() => setDetailItem(null)}
        icon="person-circle-outline"
        title={detailItem ? contractorName(detailItem) : "Contractor"}
        subtitle={detailItem?.ServiceName || "—"}
        maxHeight="90%"
        footer={<Btn label="Close" icon="close-outline" onPress={() => setDetailItem(null)} />}
      >
        <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
          {hasActivePlan && (
            <View style={styles.accessBanner}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
              <Text style={styles.accessText}>You have access to this contractor's details</Text>
            </View>
          )}

          <View style={styles.tileGrid}>
            <DetailTile icon="business-outline" label="Company" value={detailItem?.CompanyName || detailItem?.Name} />
            <DetailTile icon="mail-outline" label="Email" value={detailItem?.EmailId} />
            <DetailTile icon="call-outline" label="Mobile" value={contractorPhone(detailItem)} />
            <DetailTile
              icon="location-outline"
              label="Location"
              value={[detailItem?.CityName, detailItem?.StateName].filter(Boolean).join(", ") || "India"}
            />
            <DetailTile icon="map-outline" label="Pin code" value={detailItem?.PinCode} />
            <DetailTile icon="pulse-outline" label="Status" value={detailItem?.Status} />
            <DetailTile icon="briefcase-outline" label="Service" value={detailItem?.ServiceName} />
          </View>

          {!!contractorPhone(detailItem) && (
            <Pressable
              onPress={() => callNumber(contractorPhone(detailItem))}
              style={({ pressed }) => [styles.callFull, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.callFullText}>Call {contractorName(detailItem)}</Text>
            </Pressable>
          )}
        </ScrollView>
      </Sheet>

      <Toast toast={toast} onHide={hideToast} />
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  listContent: { paddingHorizontal: 12, paddingBottom: 32, flexGrow: 1 },
  listHead: { paddingTop: 12, gap: 10, marginBottom: 6 },
  gridItem: { flex: 1, padding: 6 },

  crumbRow: { alignItems: "center", gap: 4, paddingVertical: 2 },
  crumbItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  crumbChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, maxWidth: 180 },
  crumbText: { fontSize: 11, fontWeight: "700" },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  title: { flex: 1, color: COLORS.ink, fontSize: 19, fontWeight: "900" },
  countBadge: {
    minWidth: 30,
    height: 26,
    borderRadius: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.indigoLight,
  },
  countText: { color: COLORS.primary, fontSize: 12, fontWeight: "800" },

  /* Membership */
  member: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  memberOn: { backgroundColor: "#FAF5FF", borderColor: "#E9D5FF" },
  memberOff: { backgroundColor: COLORS.amberLight, borderColor: COLORS.amberLine },
  memberIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  memberEyebrow: { fontSize: 11, fontWeight: "700" },
  memberTitle: { color: COLORS.ink, fontSize: 14, fontWeight: "800", marginTop: 1 },
  memberSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  memberBtn: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.brand,
  },
  memberBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  /* Contractor card */
  cCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: "hidden",
    elevation: 1,
  },
  cImageWrap: {
    height: 144,
    margin: 8,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.slateLight,
  },
  cImage: { width: "100%", height: "100%" },
  cShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.18)" },
  ratingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  ratingText: { color: COLORS.slate, fontSize: 10, fontWeight: "900" },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  cBody: { paddingHorizontal: 14, paddingBottom: 14 },
  cName: { color: COLORS.slate, fontSize: 14, fontWeight: "800" },
  cLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
    marginBottom: 12,
  },
  cLoc: { color: COLORS.faint, fontSize: 11, flex: 1 },
  cActions: { flexDirection: "row", gap: 8 },
  viewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 12,
  },
  viewBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.greenLine,
    backgroundColor: COLORS.surface,
  },
  callBtnText: { color: COLORS.green, fontSize: 12, fontWeight: "800" },
  skel: { height: 12, borderRadius: 6, backgroundColor: COLORS.slateLight },

  /* Empty / loading */
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 6,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.slateLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  stateTitle: { color: COLORS.ink, fontSize: 15, fontWeight: "800", textAlign: "center" },
  stateText: { color: COLORS.muted, fontSize: 12, textAlign: "center", lineHeight: 18 },

  /* Sheets */
  sheetRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.6)" },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 6,
  },
  sheetHead: {
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
  sheetContent: { flexShrink: 1 },
  sheetFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  btnText: { fontSize: 13, fontWeight: "800" },
  confirmText: { color: COLORS.muted, fontSize: 14, lineHeight: 21 },

  /* Plan card */
  planCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
    gap: 6,
  },
  planTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  planName: { flex: 1, color: COLORS.ink, fontSize: 16, fontWeight: "900" },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COLORS.greenLight,
  },
  activePillText: { color: COLORS.green, fontSize: 10, fontWeight: "800" },
  planPrice: { color: COLORS.primary, fontSize: 30, fontWeight: "900", marginTop: 4 },
  planPer: { color: COLORS.muted, fontSize: 12, marginBottom: 6 },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bulletText: { flex: 1, color: COLORS.slate, fontSize: 13 },

  /* Payment */
  summary: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.indigoLight,
    borderWidth: 1,
    borderColor: COLORS.indigoLine,
    gap: 10,
  },
  summaryEyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryLabel: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },
  summaryValue: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 1,
    textAlign: "right",
  },
  summaryTotal: { paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.indigoLine },
  summaryTotalValue: { color: COLORS.primary, fontSize: 22, fontWeight: "900" },
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.slateLight,
  },
  secureText: { flex: 1, color: COLORS.muted, fontSize: 11, lineHeight: 16 },

  /* Details */
  accessBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.greenLine,
  },
  accessText: { flex: 1, color: "#047857", fontSize: 12, fontWeight: "800" },
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
    backgroundColor: COLORS.indigoLight,
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
  tileValue: { color: COLORS.slate, fontSize: 13, fontWeight: "800", marginTop: 2 },
  callFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.green,
  },
  callFullText: { color: "#fff", fontSize: 14, fontWeight: "800" },

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