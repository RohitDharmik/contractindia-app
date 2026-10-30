// screens/individual/CompanySubServices.jsx
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useNavigation } from "@react-navigation/native";
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
import { useCategoryStore } from "../../store/categoryStore";
import ScreenHeader from "../../components/ScreenHeader";
import { Screen } from "@/components";
import { openRazorpay } from "../../utils/razorpayCheckout";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const API_URL = process.env.EXPO_PUBLIC_API_URL || "";
const RAZORPAY_KEY =
  process.env.EXPO_PUBLIC_RAZORPAY_KEY || "rzp_test_TBIngVA6fjYaLH";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop",
];

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const T = {
  brand: "#4F46E5",
  brandDeep: "#312E81",
  brandSoft: "#EEF2FF",
  brandLine: "#C7D2FE",
  ink: "#0F172A",
  body: "#334155",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  surface: "#FFFFFF",
  canvas: "#F6F7FB",
  slateSoft: "#F1F5F9",
  success: "#059669",
  successSoft: "#ECFDF5",
  successLine: "#A7F3D0",
  warning: "#D97706",
  warningSoft: "#FFFBEB",
  warningLine: "#FDE68A",
  danger: "#DC2626",
  dangerSoft: "#FEF2F2",
};

const RADIUS = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

const SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

// Category accents. Each depth level gets one, so breadcrumbs and tree stay readable.
const ACCENTS = [
  { solid: "#4F46E5", soft: "#EEF2FF", ink: "#3730A3", dot: "#6366F1" },
  { solid: "#0E7490", soft: "#ECFEFF", ink: "#155E75", dot: "#06B6D4" },
  { solid: "#047857", soft: "#ECFDF5", ink: "#065F46", dot: "#10B981" },
  { solid: "#B45309", soft: "#FFFBEB", ink: "#92400E", dot: "#F59E0B" },
  { solid: "#BE123C", soft: "#FFF1F2", ink: "#9F1239", dot: "#F43F5E" },
  { solid: "#6D28D9", soft: "#F5F3FF", ink: "#5B21B6", dot: "#8B5CF6" },
];
const accentAt = (depth) => ACCENTS[depth % ACCENTS.length];

// Trade icon by service name. First match wins.
const TRADE_ICONS = [
  [/electr|power|solar|wire/i, { lib: "mci", name: "lightning-bolt-outline" }],
  [/arch|interior|design/i, { lib: "mci", name: "office-building-outline" }],
  [/civil|construct|build|infra|epc/i, { lib: "mci", name: "crane" }],
  [/plumb|water|sanitar/i, { lib: "mci", name: "pipe-wrench" }],
  [/hvac|air|cool/i, { lib: "mci", name: "air-conditioner" }],
  [/fire/i, { lib: "mci", name: "fire-alert" }],
  [/legal|law|contract|audit|tender/i, { lib: "mci", name: "scale-balance" }],
  [/material|steel|cement|supply/i, { lib: "mci", name: "cube-outline" }],
  [/paint|finish/i, { lib: "mci", name: "format-paint" }],
  [/market|brand|advert/i, { lib: "mci", name: "bullhorn-outline" }],
];

const tradeIconFor = (name = "") =>
  TRADE_ICONS.find(([re]) => re.test(name))?.[1] ?? {
    lib: "ion",
    name: "construct-outline",
  };

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

const contractorName = (c) => c?.CompanyName || c?.Name || "Contractor";
const contractorPhone = (c) => c?.MobileNo || c?.PhoneNo || "";

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
/* Icon                                                                */
/* ------------------------------------------------------------------ */

function Icon({ spec, size = 18, color = T.ink }) {
  if (spec.lib === "mci") {
    return <MaterialCommunityIcons name={spec.name} size={size} color={color} />;
  }
  return <Ionicons name={spec.name} size={size} color={color} />;
}

const ico = (name) => ({ lib: "ion", name });

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

function FadeIn({ delay = 0, style, children }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 380,
      delay,
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

function Pulse({ style }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[style, { opacity }]} />;
}

/* A press-feedback surface: scales slightly on press. */
function Pressy({ onPress, disabled, style, children, label, hitSlop }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) =>
    Animated.spring(scale, {
      toValue: v,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        hitSlop={hitSlop}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Shared UI                                                           */
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
    <View style={[styles.toast, { backgroundColor: ok ? T.success : T.danger }]}>
      <Ionicons
        name={ok ? "checkmark-circle" : "alert-circle"}
        size={20}
        color="#fff"
      />
      <Text style={styles.toastText} numberOfLines={2}>
        {toast.message}
      </Text>
    </View>
  );
}

function Button({ label, icon, onPress, variant = "ghost", disabled, loading, style }) {
  const filled = variant !== "ghost";
  const tint = variant === "primary" ? "#fff" : variant === "success" ? "#fff" : T.ink;
  const bg =
    variant === "primary" ? T.brand : variant === "success" ? T.success : T.surface;

  return (
    <Pressy
      onPress={onPress}
      disabled={disabled || loading}
      label={label}
      style={[{ flex: 1 }, style]}
    >
      <View
        style={[
          styles.button,
          { backgroundColor: bg },
          !filled && styles.buttonGhost,
          (disabled || loading) && { opacity: 0.5 },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={tint} />
        ) : icon ? (
          <Ionicons name={icon} size={17} color={tint} />
        ) : null}
        <Text style={[styles.buttonText, { color: tint }]}>{label}</Text>
      </View>
    </Pressy>
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
  maxHeight = "88%",
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
          <View style={styles.sheetGrip} />
          <View style={styles.sheetHead}>
            <View style={styles.sheetIcon}>
              <Ionicons name={icon} size={20} color={T.brand} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {title}
              </Text>
              {!!subtitle && (
                <Text style={styles.sheetSub} numberOfLines={2}>
                  {subtitle}
                </Text>
              )}
            </View>
            {dismissable && (
              <Pressable
                onPress={handleClose}
                hitSlop={10}
                style={styles.sheetClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={18} color={T.muted} />
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
/* Breadcrumb                                                          */
/* ------------------------------------------------------------------ */

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
      style={styles.crumbScroll}
      contentContainerStyle={styles.crumbRow}
    >
      {path.map((node, i) => {
        const last = i === path.length - 1;
        const a = accentAt(i);
        return (
          <View key={String(node.ServiceID)} style={styles.crumbItem}>
            {i > 0 && (
              <Ionicons name="chevron-forward" size={12} color={T.faint} />
            )}
            <Pressable
              disabled={last}
              onPress={() => onSelect(node)}
              accessibilityRole="button"
              accessibilityState={{ disabled: last, selected: last }}
              style={[styles.crumbChip, last && { backgroundColor: a.soft }]}
            >
              <Text
                numberOfLines={1}
                style={[styles.crumbText, { color: last ? a.ink : T.muted }]}
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

const MembershipCard = memo(function MembershipCard({
  hasActivePlan,
  activeSub,
  onAction,
}) {
  return (
    <View style={styles.member}>
      <View style={styles.memberGlow} />
      <View style={styles.memberTop}>
        <View style={styles.memberIcon}>
          <Ionicons
            name={hasActivePlan ? "ribbon" : "lock-closed"}
            size={18}
            color="#fff"
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.memberEyebrow}>
            {hasActivePlan ? "ACTIVE MEMBERSHIP" : "MEMBERSHIP REQUIRED"}
          </Text>
          <Text style={styles.memberTitle} numberOfLines={1}>
            {hasActivePlan ? activeSub?.PlanName ?? "Plan" : "No active plan"}
          </Text>
        </View>
        <View
          style={[
            styles.statusChip,
            hasActivePlan ? styles.statusChipOn : styles.statusChipOff,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: hasActivePlan ? T.success : T.warning },
            ]}
          />
          <Text style={styles.statusChipText}>
            {hasActivePlan ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <Text style={styles.memberSub} numberOfLines={2}>
        {hasActivePlan
          ? `Expires on ${activeSub?.ExpiryDate ?? "—"}`
          : "Purchase a plan to unlock contractor details and direct calls."}
      </Text>

      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={hasActivePlan ? "Upgrade plan" : "Buy plan"}
        style={({ pressed }) => [styles.memberBtn, pressed && { opacity: 0.85 }]}
      >
        <Ionicons
          name={hasActivePlan ? "arrow-up-circle-outline" : "card-outline"}
          size={16}
          color={T.brand}
        />
        <Text style={styles.memberBtnText}>
          {hasActivePlan ? "Upgrade plan" : "Buy plan"}
        </Text>
      </Pressable>
    </View>
  );
});

/* ------------------------------------------------------------------ */
/* Contractor card                                                     */
/* ------------------------------------------------------------------ */

const ContractorCard = memo(function ContractorCard({ item, idx, onView, disabled }) {
  const [imgFailed, setImgFailed] = useState(false);

  const company = contractorName(item);
  const location = item?.CityName || item?.StateName || "India";
  const phone = contractorPhone(item);
  const status = item?.Status || "";
  const rating =
    typeof item?.Rating === "number" ? item.Rating : 4.5 + (idx % 5) * 0.1;
  const remote = API_URL
    ? `${API_URL}/UserDocumentStore/image?userId=${item?.UserID}&documentCategoryId=7&documentSubCategoryId=10`
    : null;
  const source = {
    uri: remote && !imgFailed ? remote : FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length],
  };
  const viewed = Number(item?.IsActive) === 1;
  const approved = status === "Approved";

  return (
    <View style={styles.card}>
      <View style={styles.cardMedia}>
        <Image
          source={source}
          style={styles.cardImage}
          onError={() => setImgFailed(true)}
        />
        <View style={styles.cardShade} />

        <View style={styles.ratingChip}>
          <Ionicons name="star" size={11} color="#FBBF24" />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>

        {!!status && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: approved ? T.success : T.warning },
            ]}
          >
            <Ionicons
              name={approved ? "shield-checkmark" : "time"}
              size={11}
              color="#fff"
            />
            <Text style={styles.statusBadgeText}>{status}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {company}
        </Text>
        <View style={styles.cardLocRow}>
          <Ionicons name="location" size={13} color={T.faint} />
          <Text style={styles.cardLoc} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <Pressy
            onPress={() => onView(item)}
            disabled={disabled}
            label={viewed ? "Viewed" : "View details"}
            style={{ flex: 1 }}
          >
            <View
              style={[
                styles.primaryAction,
                viewed ? styles.primaryActionDone : styles.primaryActionOpen,
                disabled && { opacity: 0.5 },
              ]}
            >
              <Ionicons
                name={viewed ? "checkmark-circle" : "eye"}
                size={16}
                color={viewed ? T.body : "#fff"}
              />
              <Text
                style={[
                  styles.primaryActionText,
                  { color: viewed ? T.body : "#fff" },
                ]}
              >
                {viewed ? "Viewed" : "View details"}
              </Text>
            </View>
          </Pressy>

          {!!phone && viewed && (
            <Pressy onPress={() => callNumber(phone)} label="Call contractor">
              <View style={styles.callAction}>
                <Ionicons name="call" size={16} color={T.success} />
              </View>
            </Pressy>
          )}
        </View>
      </View>
    </View>
  );
});

function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Pulse style={styles.skelMedia} />
      <View style={styles.cardBody}>
        <Pulse style={[styles.skelLine, { width: "70%" }]} />
        <Pulse style={[styles.skelLine, { width: "45%", marginTop: 8 }]} />
        <Pulse style={[styles.skelBtn, { marginTop: 14 }]} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Plan card                                                           */
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
          <View style={styles.planActive}>
            <Text style={styles.planActiveText}>Current</Text>
          </View>
        )}
      </View>

      <View style={styles.planPriceRow}>
        <Text style={styles.planPrice}>{free ? "Free" : formatINR(price)}</Text>
        {!free && (
          <Text style={styles.planPer}>
            / {(plan?.DurationType || "month").toLowerCase()}
          </Text>
        )}
      </View>

      <View style={styles.planBenefits}>
        <Benefit icon="layers-outline" text={`Up to ${plan?.maxNoofServices ?? "unlimited"} services`} />
        <Benefit icon="shield-checkmark-outline" text={plan?.Remark || "Full access to contractor details"} />
      </View>

      <Button
        label={free ? "Activate free plan" : "Select plan"}
        icon={free ? "gift-outline" : "arrow-forward"}
        variant="primary"
        onPress={() => onSelect(plan)}
        loading={busy}
        disabled={busy}
      />
    </View>
  );
}

function Benefit({ icon, text }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}>
        <Ionicons name={icon} size={14} color={T.success} />
      </View>
      <Text style={styles.benefitText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

function DetailTile({ icon, label, value }) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={15} color={T.brand} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.tileValue} numberOfLines={2}>
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Related services                                                    */
/* ------------------------------------------------------------------ */

const RelatedRow = memo(function RelatedRow({ service, onPress }) {
  const spec = tradeIconFor(service.ServiceName);
  const description = service?.ServiceDescription ?? service?.serviceDescription ?? "";

  return (
    <Pressable
      onPress={() => onPress(service)}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${service.ServiceName}`}
      style={({ pressed }) => [styles.relRow, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.relIcon}>
        <Icon spec={spec} size={18} color={T.brand} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.relName} numberOfLines={1}>
          {service.ServiceName}
        </Text>
        {typeof description === "string" && !!description.trim() && (
          <Text style={styles.relDesc} numberOfLines={2}>
            {description.trim()}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={T.faint} />
    </Pressable>
  );
});

function RelatedGroup({ title, icon, services, emptyText, onSelect }) {
  return (
    <View style={styles.relGroup}>
      <View style={styles.relGroupHead}>
        <Ionicons name={icon} size={16} color={T.muted} />
        <Text style={styles.relGroupTitle}>{title}</Text>
        <View style={styles.relCount}>
          <Text style={styles.relCountText}>{services.length}</Text>
        </View>
      </View>
      {services.length ? (
        services.map((service) => (
          <RelatedRow
            key={String(service.ServiceID)}
            service={service}
            onPress={onSelect}
          />
        ))
      ) : (
        <Text style={styles.relEmpty}>{emptyText}</Text>
      )}
    </View>
  );
}

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

  const activeId = useCategoryStore((s) => s.activeId);
  const selectCategory = useCategoryStore((s) => s.select);

  const [companyUserID, setCompanyUserID] = useState(0);
  const [plansOpen, setPlansOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [pendingItem, setPendingItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

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

  const relatedServices = useMemo(() => {
    if (!activeNode) return { children: [], peers: [] };
    const activeServiceId = Number(activeNode.ServiceID);
    const parentServiceId = Number(activeNode.ParentServiceID ?? 0);
    const peers = flattenTree(fullTree).filter(
      (node) =>
        Number(node.ParentServiceID ?? 0) === parentServiceId &&
        Number(node.ServiceID) !== activeServiceId,
    );
    return { children: activeNode.children ?? [], peers };
  }, [activeNode, fullTree]);

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

  const handleViewDetails = useCallback(
    (item) => {
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
    },
    [isLoggedIn, hasActivePlan, navigation, openDetail, showToast],
  );

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

  const handleCrumbSelect = useCallback(
    (node) => {
      selectCategory(node.ServiceID, [...getAncestorIds(fullTree, node.ServiceID)]);
      navigation.setParams({ serviceId: node.ServiceID, serviceName: node.ServiceName });
    },
    [fullTree, navigation, selectCategory],
  );

  const handleRelatedServiceSelect = useCallback(
    (node) => {
      selectCategory(node.ServiceID, [...getAncestorIds(fullTree, node.ServiceID)]);
      navigation.navigate("CompanySubServices", {
        serviceId: node.ServiceID,
        serviceName: node.ServiceName,
      });
    },
    [fullTree, navigation, selectCategory],
  );

  /* ── Render pieces ── */
  const listHeader = (
    <View style={styles.listHead}>
      {isLoggedIn && (
        <FadeIn>
          <MembershipCard
            hasActivePlan={hasActivePlan}
            activeSub={activeSub}
            onAction={() => setPlansOpen(true)}
          />
        </FadeIn>
      )}

      <Breadcrumb tree={fullTree} activeId={activeId} onSelect={handleCrumbSelect} />

      <View style={styles.titleRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.sectionEyebrow}>SPECIALISTS</Text>
          <Text style={styles.title} numberOfLines={2}>
            {activeNode?.ServiceName ?? "Select a category"}
          </Text>
        </View>
        {!contractorsLoading && !!activeId && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const relatedFooter = (
    <FadeIn delay={120}>
      <View style={styles.relatedWrap}>
        <View style={styles.relatedHeading}>
          <View style={styles.relatedHeadingIcon}>
            <Ionicons name="git-network-outline" size={18} color={T.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.relatedTitle}>Explore related services</Text>
            <Text style={styles.relatedSub}>Browse nearby categories</Text>
          </View>
        </View>

        {menuQuery.isLoading ? (
          <View style={styles.relState}>
            <ActivityIndicator size="small" color={T.brand} />
            <Text style={styles.relEmpty}>Loading related services…</Text>
          </View>
        ) : menuQuery.isError ? (
          <View style={styles.relState}>
            <Ionicons name="cloud-offline-outline" size={20} color={T.faint} />
            <Text style={styles.relEmpty}>Related services could not be loaded.</Text>
            <Pressable
              onPress={() => menuQuery.refetch()}
              accessibilityRole="button"
              style={styles.retryPill}
            >
              <Text style={styles.retryPillText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <RelatedGroup
              title="Child services"
              icon="git-branch-outline"
              services={relatedServices.children}
              emptyText="No child services for this category."
              onSelect={handleRelatedServiceSelect}
            />
            <RelatedGroup
              title="Peer services"
              icon="people-outline"
              services={relatedServices.peers}
              emptyText="No peer services in this category."
              onSelect={handleRelatedServiceSelect}
            />
          </>
        )}
      </View>
    </FadeIn>
  );

  const emptyState = contractorsLoading ? null : (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <Ionicons name="business-outline" size={28} color={T.brand} />
      </View>
      <Text style={styles.emptyTitle}>
        {activeId ? "No specialists found" : "Select a category"}
      </Text>
      <Text style={styles.emptyText}>
        {activeId
          ? "Try a different category from the breadcrumb or menu."
          : "Open the menu to choose a service category."}
      </Text>
    </View>
  );

  const loadingGrid = Array.from({ length: columns * 2 }, (_, i) => ({ id: `sk-${i}` }));

  return (
    <Screen>
      <StatusBar barStyle="dark-content" backgroundColor={T.canvas} />

      <ScreenHeader
        title={parentName}
        subtitle={`${totalNodes} categories`}
        icon="business"
        showBack
        onBack={handleBack}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open categories"
            onPress={() => navigation.openDrawer()}
            style={styles.headerAction}
          >
            <Ionicons name="menu-outline" size={20} color={T.ink} />
          </Pressable>
        }
      />

      <FlatList
        key={`grid-${columns}`}
        style={styles.list}
        data={contractorsLoading ? loadingGrid : filtered}
        numColumns={columns}
        keyExtractor={(item, i) => String(item?.UserID ?? item?.id ?? i)}
        renderItem={({ item, index }) => (
          <View style={styles.gridItem}>
            {contractorsLoading ? (
              <CardSkeleton />
            ) : (
              <ContractorCard
                item={item}
                idx={index}
                onView={handleViewDetails}
                disabled={busy}
              />
            )}
          </View>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyState}
        ListFooterComponent={relatedFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={contractorsQuery.isFetching && !contractorsQuery.isLoading}
            onRefresh={() => contractorsQuery.refetch()}
            tintColor={T.brand}
            colors={[T.brand]}
          />
        }
      />

      {/* Confirm viewing details */}
      <Sheet
        visible={!!pendingItem}
        onClose={() => setPendingItem(null)}
        dismissable={!busy}
        icon="eye-outline"
        title="View contractor details"
        subtitle="Confirm to use one unit of your access."
        maxHeight="55%"
        footer={
          <>
            <Button
              label="Cancel"
              icon="close"
              onPress={() => setPendingItem(null)}
              disabled={busy}
            />
            <Button
              label="View details"
              icon="checkmark"
              variant="primary"
              onPress={confirmPending}
              loading={busy}
              disabled={busy}
            />
          </>
        }
      >
        <View style={styles.confirmBody}>
          <Text style={styles.confirmText}>
            Are you sure you want to view details for{" "}
            <Text style={styles.confirmStrong}>
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
          <View style={styles.sheetState}>
            <ActivityIndicator size="large" color={T.brand} />
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.sheetState}>
            <Ionicons name="pricetags-outline" size={26} color={T.faint} />
            <Text style={styles.emptyText}>No plans available right now.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.planList}>
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
        icon="card-outline"
        title="Confirm payment"
        subtitle="Subscribe to access contractor details"
        maxHeight="75%"
        footer={
          <>
            <Button label="Cancel" icon="close" onPress={closePayment} disabled={busy} />
            <Button
              label={
                Number(paymentPlan?.Price) === 0
                  ? "Activate"
                  : `Pay ${formatINR(paymentPlan?.Price)}`
              }
              icon="lock-closed"
              variant="primary"
              onPress={handlePay}
              loading={busy}
              disabled={busy}
            />
          </>
        }
      >
        <ScrollView contentContainerStyle={styles.payBody}>
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
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>{formatINR(paymentPlan?.Price)}</Text>
            </View>
          </View>

          <View style={styles.secureNote}>
            <Ionicons name="shield-checkmark" size={16} color={T.success} />
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
        footer={<Button label="Close" icon="close" onPress={() => setDetailItem(null)} />}
      >
        <ScrollView contentContainerStyle={styles.detailBody}>
          {hasActivePlan && (
            <View style={styles.accessBanner}>
              <Ionicons name="shield-checkmark" size={18} color={T.success} />
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
              accessibilityRole="button"
              accessibilityLabel={`Call ${contractorName(detailItem)}`}
              style={({ pressed }) => [styles.callFull, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="call" size={17} color="#fff" />
              <Text style={styles.callFullText}>Call {contractorName(detailItem)}</Text>
            </Pressable>
          )}
        </ScrollView>
      </Sheet>

      <Toast toast={toast} onHide={hideToast} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  headerAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingBottom: 40, flexGrow: 1 },
  listHead: { paddingTop: 14, gap: 14, marginBottom: 8 },
  gridItem: { flex: 1, padding: 5 },

  /* Membership */
  member: {
    borderRadius: RADIUS.xl,
    padding: 16,
    gap: 12,
    backgroundColor: T.brandDeep,
    overflow: "hidden",
    ...SHADOW,
  },
  memberGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -70,
    right: -40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  memberTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  memberIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  memberEyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  memberTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginTop: 2 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  statusChipOn: { backgroundColor: "rgba(16,185,129,0.18)" },
  statusChipOff: { backgroundColor: "rgba(245,158,11,0.2)" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  memberSub: { color: "rgba(255,255,255,0.78)", fontSize: 12, lineHeight: 17 },
  memberBtn: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: RADIUS.md,
    backgroundColor: "#FFFFFF",
  },
  memberBtnText: { color: T.brand, fontSize: 13, fontWeight: "800" },

  /* Breadcrumb */
  crumbScroll: { flexGrow: 0 },
  crumbRow: { alignItems: "center", gap: 4, paddingVertical: 2 },
  crumbItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  crumbChip: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    maxWidth: 180,
  },
  crumbText: { fontSize: 12, fontWeight: "700" },

  /* Title */
  titleRow: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginTop: 2 },
  sectionEyebrow: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: { color: T.ink, fontSize: 20, fontWeight: "900", letterSpacing: -0.3 },
  countBadge: {
    minWidth: 34,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.brandSoft,
  },
  countText: { color: T.brand, fontSize: 13, fontWeight: "800" },

  /* Contractor card */
  card: {
    backgroundColor: T.surface,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    ...SHADOW,
  },
  cardMedia: {
    height: 136,
    margin: 6,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    backgroundColor: T.slateSoft,
  },
  cardImage: { width: "100%", height: "100%" },
  cardShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.12)",
  },
  ratingChip: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  ratingText: { color: T.ink, fontSize: 11, fontWeight: "800" },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  cardBody: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  cardName: { color: T.ink, fontSize: 15, fontWeight: "800" },
  cardLocRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  cardLoc: { flex: 1, color: T.muted, fontSize: 12 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  primaryAction: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: RADIUS.md,
  },
  primaryActionOpen: { backgroundColor: T.brand },
  primaryActionDone: { backgroundColor: T.slateSoft },
  primaryActionText: { fontSize: 13, fontWeight: "800" },
  callAction: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.successSoft,
    borderWidth: 1,
    borderColor: T.successLine,
  },
  skelMedia: { height: 136, margin: 6, borderRadius: RADIUS.md, backgroundColor: T.slateSoft },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: T.slateSoft },
  skelBtn: { height: 42, borderRadius: RADIUS.md, backgroundColor: T.slateSoft },

  /* Empty */
  emptyWrap: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 24, gap: 6 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.brandSoft,
    marginBottom: 6,
  },
  emptyTitle: { color: T.ink, fontSize: 16, fontWeight: "800" },
  emptyText: { color: T.muted, fontSize: 13, lineHeight: 19, textAlign: "center" },
  sheetState: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 10 },

  /* Related */
  relatedWrap: {
    marginTop: 24,
    padding: 16,
    borderRadius: RADIUS.xl,
    backgroundColor: T.surface,
    ...SHADOW,
  },
  relatedHeading: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  relatedHeadingIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.brandSoft,
  },
  relatedTitle: { color: T.ink, fontSize: 16, fontWeight: "800" },
  relatedSub: { color: T.muted, fontSize: 12, marginTop: 2 },
  relGroup: { marginTop: 8 },
  relGroupHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  relGroupTitle: { flex: 1, color: T.body, fontSize: 13, fontWeight: "800" },
  relCount: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    backgroundColor: T.slateSoft,
  },
  relCountText: { color: T.body, fontSize: 11, fontWeight: "800" },
  relRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line,
  },
  relIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.brandSoft,
  },
  relName: { color: T.ink, fontSize: 14, fontWeight: "700" },
  relDesc: { color: T.muted, fontSize: 12, lineHeight: 16, marginTop: 2 },
  relEmpty: { color: T.muted, fontSize: 12, lineHeight: 18, paddingVertical: 8 },
  relState: { minHeight: 72, alignItems: "center", justifyContent: "center", gap: 8 },
  retryPill: {
    paddingHorizontal: 14,
    height: 34,
    justifyContent: "center",
    borderRadius: RADIUS.pill,
    backgroundColor: T.brandSoft,
  },
  retryPillText: { color: T.brand, fontSize: 12, fontWeight: "800" },

  /* Buttons */
  button: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
  },
  buttonGhost: { borderWidth: 1, borderColor: T.line },
  buttonText: { fontSize: 14, fontWeight: "800" },

  /* Sheets */
  sheetRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.5)" },
  sheet: {
    backgroundColor: T.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    paddingBottom: 4,
  },
  sheetGrip: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.line,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sheetIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.brandSoft,
  },
  sheetTitle: { color: T.ink, fontSize: 17, fontWeight: "800" },
  sheetSub: { color: T.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.slateSoft,
  },
  sheetContent: { flexShrink: 1 },
  sheetFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line,
  },
  confirmBody: { padding: 20 },
  confirmText: { color: T.body, fontSize: 14, lineHeight: 21 },
  confirmStrong: { color: T.ink, fontWeight: "800" },

  /* Plans */
  planList: { padding: 16, gap: 12 },
  planCard: {
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.line,
    backgroundColor: T.surface,
    gap: 12,
  },
  planTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  planName: { flex: 1, color: T.ink, fontSize: 16, fontWeight: "800" },
  planActive: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: T.successSoft,
  },
  planActiveText: { color: T.success, fontSize: 11, fontWeight: "800" },
  planPriceRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  planPrice: { color: T.brand, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  planPer: { color: T.muted, fontSize: 13, fontWeight: "600", marginBottom: 4 },
  planBenefits: { gap: 8 },
  benefit: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.successSoft,
  },
  benefitText: { flex: 1, color: T.body, fontSize: 13, lineHeight: 18 },

  /* Payment */
  payBody: { padding: 20, gap: 14 },
  summary: {
    padding: 18,
    borderRadius: RADIUS.lg,
    backgroundColor: T.brandSoft,
    gap: 12,
  },
  summaryEyebrow: { color: T.brand, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryLabel: { color: T.muted, fontSize: 13, fontWeight: "600" },
  summaryValue: { color: T.brand, fontSize: 13, fontWeight: "800", flexShrink: 1, textAlign: "right" },
  summaryTotal: { paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.brandLine },
  summaryTotalValue: { color: T.brand, fontSize: 22, fontWeight: "900" },
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: T.slateSoft,
  },
  secureText: { flex: 1, color: T.muted, fontSize: 12, lineHeight: 17 },

  /* Details */
  detailBody: { padding: 20, gap: 14 },
  accessBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: T.successSoft,
    borderWidth: 1,
    borderColor: T.successLine,
  },
  accessText: { flex: 1, color: "#047857", fontSize: 13, fontWeight: "700" },
  tileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: T.canvas,
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface,
  },
  tileLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tileValue: { color: T.ink, fontSize: 13, fontWeight: "700", marginTop: 2 },
  callFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: T.success,
  },
  callFullText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  /* Toast */
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    ...SHADOW,
    elevation: 6,
  },
  toastText: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "700" },
});