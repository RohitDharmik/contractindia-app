// screens/plans/PlansAndSubscriptionsScreen.jsx
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
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  planMasterGetById,
  UserPaymentHistorySave,
  UserSubscriptionDetailGet,
  userSubscriptionDetailSave,
} from "../../api/api";
import ScreenHeader from "../../components/ScreenHeader";
import { Screen } from "@/components";
import { useAuthStore } from "@/store/authStore";
import { openRazorpay } from "../../utils/razorpayCheckout";
/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const COLORS = {
  primary: "#4F46E5",
  primaryDark: "#4338CA",
  violet: "#7C3AED",
  primaryLight: "#EEF2FF",
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
  redLine: "#FECACA",
  slateLight: "#F1F5F9",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
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

const fetchPlans = async (userType) =>
  unwrapList(await planMasterGetById(`userType=${userType}`));
const fetchSubscriptions = async (userId) =>
  unwrapList(await UserSubscriptionDetailGet(`userId=${userId}`));

const pick = (o, a, b, d) => o?.[a] ?? o?.[b] ?? d;

const formatINR = (value) => {
  const n = Number(value);
  if (value == null || value === "" || Number.isNaN(n)) return "—";
  if (n === 0) return "Free";
  return `₹${n.toLocaleString("en-IN")}`;
};

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = dayjs(iso);
  return d.isValid() ? d.format("DD MMM YYYY") : String(iso);
};

const normalizePlan = (p) => ({
  raw: p,
  id: Number(pick(p, "PlanID", "planID", 0)),
  name: pick(p, "PlanName", "planName", "Plan"),
  price: Number(pick(p, "Price", "price", 0)),
  duration: pick(p, "DurationType", "durationType", ""),
  maxServices: pick(p, "maxNoofServices", "MaxNoofServices", "—"),
  userTypeName: pick(p, "UserTypeName", "userTypeName", ""),
  remark: pick(p, "Remark", "remark", ""),
});

const normalizeSub = (s) => ({
  raw: s,
  id: pick(s, "SubscriptionID", "subscriptionID", 0),
  planId: Number(pick(s, "PlanID", "planID", 0)),
  planName: pick(s, "PlanName", "planName", "Plan"),
  isActive: Number(pick(s, "IsActive", "isActive", 0)) === 1,
  enterDate: pick(s, "EnterDate", "enterDate", null),
  expiryRaw: pick(s, "planExpiryDate", "PlanExpiryDate", null),
  remark: pick(s, "Remark", "remark", ""),
});

// Status: Expired if the expiry date has passed, otherwise Active or Inactive.
const subStatus = (sub) => {
  if (sub.expiryRaw) {
    const exp = dayjs(sub.expiryRaw);
    if (exp.isValid() && exp.isBefore(dayjs(), "day")) return "expired";
  }
  return sub.isActive ? "active" : "inactive";
};

const STATUS_META = {
  active: {
    label: "Active",
    icon: "checkmark-circle",
    fg: COLORS.green,
    bg: COLORS.greenLight,
    border: COLORS.greenLine,
  },
  expired: {
    label: "Expired",
    icon: "alert-circle",
    fg: COLORS.red,
    bg: COLORS.redLight,
    border: COLORS.redLine,
  },
  inactive: {
    label: "Inactive",
    icon: "ellipse-outline",
    fg: COLORS.muted,
    bg: COLORS.slateLight,
    border: COLORS.line,
  },
};

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function Chip({ icon, text, tone = "default" }) {
  const isViolet = tone === "violet";
  return (
    <View style={[styles.chip, isViolet && styles.chipViolet]}>
      {!!icon && (
        <Ionicons
          name={icon}
          size={11}
          color={isViolet ? COLORS.violet : COLORS.muted}
        />
      )}
      <Text
        style={[styles.chipText, isViolet && { color: COLORS.violet }]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status];
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: m.bg, borderColor: m.border },
      ]}
    >
      <Ionicons name={m.icon} size={11} color={m.fg} />
      <Text style={[styles.statusText, { color: m.fg }]}>{m.label}</Text>
    </View>
  );
}

function ActionBtn({ icon, label, variant = "ghost", onPress, disabled }) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionBtn,
        isPrimary ? styles.actionPrimary : styles.actionGhost,
        pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Ionicons
        name={icon}
        size={19}
        color={isPrimary ? "#fff" : COLORS.primary}
      />
      <Text
        style={[styles.actionText, { color: isPrimary ? "#fff" : COLORS.ink }]}
      >
        {label}
      </Text>
      {isPrimary && (
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      )}
    </Pressable>
  );
}

function IconBtn({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconBtn,
        pressed && { transform: [{ scale: 0.92 }] },
      ]}
    >
      <Ionicons name={icon} size={28} color={COLORS.primary} />
    </Pressable>
  );
}

function PlanCard({ plan, onView, onSubscribe }) {
  const isFree = plan.price === 0;
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Ionicons name="diamond-outline" size={18} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {plan.name}
          </Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {plan.userTypeName || "All users"}
          </Text>
        </View>
        <IconBtn icon="eye-outline" label="View details" onPress={onView} />
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatINR(plan.price)}</Text>
        {!isFree && !!plan.duration && (
          <Text style={styles.priceUnit}>/ {plan.duration.toLowerCase()}</Text>
        )}
      </View>

      <View style={styles.chipRow}>
        {!!plan.duration && (
          <Chip icon="time-outline" text={plan.duration} tone="violet" />
        )}
        <Chip icon="layers-outline" text={`Max ${plan.maxServices} services`} />
      </View>

      <ActionBtn
        icon={isFree ? "gift-outline" : "card-outline"}
        label={isFree ? "Activate free plan" : "Subscribe"}
        variant="primary"
        onPress={onSubscribe}
      />
    </View>
  );
}

function SubCard({ sub, onView }) {
  const status = subStatus(sub);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View
          style={[styles.cardIcon, { backgroundColor: STATUS_META[status].bg }]}
        >
          <Ionicons
            name="ribbon-outline"
            size={18}
            color={STATUS_META[status].fg}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {sub.planName}
          </Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            Subscription #{sub.id}
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <View style={styles.subMetaRow}>
        <View style={styles.subMeta}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.muted} />
          <Text style={styles.subMetaText} numberOfLines={1}>
            {formatDate(sub.enterDate)}
          </Text>
        </View>
        {!!sub.expiryRaw && (
          <View style={styles.subMeta}>
            <Ionicons name="hourglass-outline" size={13} color={COLORS.muted} />
            <Text style={styles.subMetaText} numberOfLines={1}>
              Expires {sub.expiryRaw}
            </Text>
          </View>
        )}
      </View>

      <ActionBtn icon="eye-outline" label="View details" onPress={onView} />
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
          numberOfLines={1}
        >
          {value ?? "—"}
        </Text>
      </View>
    </View>
  );
}

function Sheet({
  visible,
  onClose,
  dismissable = true,
  header,
  children,
  footer,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={dismissable ? onClose : undefined}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.sheetRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={styles.backdrop}
          onPress={dismissable ? onClose : undefined}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          {header}
          {children}
          {!!footer && <View style={styles.sheetFooter}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SheetCloseBtn({ onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.closeBtn,
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Ionicons name="close" size={18} color="rgba(255,255,255,0.9)" />
    </Pressable>
  );
}

/* ---------- Plan detail sheet ---------- */

function PlanDetailSheet({ plan, onClose, onSubscribe }) {
  const isFree = plan?.price === 0;
  return (
    <Sheet
      visible={!!plan}
      onClose={onClose}
      header={
        <View style={[styles.heroHeader, { backgroundColor: COLORS.primary }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.heroEyebrow}>
              <Ionicons name="diamond" size={12} color="#FDE68A" />
              <Text style={styles.heroEyebrowText}>
                {plan?.duration || "Plan"}
              </Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {plan?.name}
            </Text>
            {!!plan?.remark && (
              <Text style={styles.heroSub} numberOfLines={2}>
                {plan.remark}
              </Text>
            )}
            <View style={styles.heroPriceRow}>
              <Text style={styles.heroPrice}>
                {isFree ? "Free" : formatINR(plan?.price)}
              </Text>
              {!isFree && !!plan?.duration && (
                <Text style={styles.heroPriceUnit}>
                  / {plan.duration.toLowerCase()}
                </Text>
              )}
            </View>
          </View>
          <SheetCloseBtn onPress={onClose} />
        </View>
      }
      footer={
        <>
          <ActionBtn icon="close-outline" label="Close" onPress={onClose} />
          <ActionBtn
            icon="card-outline"
            label="Subscribe"
            variant="primary"
            onPress={() => onSubscribe(plan)}
          />
        </>
      }
    >
      <ScrollView contentContainerStyle={styles.sheetBody}>
        <View style={styles.tileGrid}>
          <DetailTile
            icon="time-outline"
            label="Duration"
            value={plan?.duration}
          />
          <DetailTile
            icon="layers-outline"
            label="Max services"
            value={plan?.maxServices}
          />
          <DetailTile
            icon="people-outline"
            label="User type"
            value={plan?.userTypeName || "All"}
          />
          <DetailTile
            icon="pricetag-outline"
            label="Price"
            value={isFree ? "Free" : formatINR(plan?.price)}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}

/* ---------- Subscription detail sheet ---------- */

function SubscriptionDetailSheet({ sub, plan, onClose }) {
  const status = sub ? subStatus(sub) : "inactive";
  const heroBg =
    status === "active"
      ? COLORS.green
      : status === "expired"
        ? COLORS.red
        : COLORS.muted;

  return (
    <Sheet
      visible={!!sub}
      onClose={onClose}
      header={
        <View style={[styles.heroHeader, { backgroundColor: heroBg }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.heroEyebrow}>
              <Ionicons name="ribbon" size={12} color="#FDE68A" />
              <Text style={styles.heroEyebrowText}>
                Subscription #{sub?.id}
              </Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {sub?.planName}
            </Text>
            <View style={styles.heroPill}>
              <Ionicons
                name={STATUS_META[status].icon}
                size={12}
                color="#fff"
              />
              <Text style={styles.heroPillText}>
                {STATUS_META[status].label}
              </Text>
            </View>
          </View>
          <SheetCloseBtn onPress={onClose} />
        </View>
      }
      footer={
        <ActionBtn icon="close-outline" label="Close" onPress={onClose} />
      }
    >
      <ScrollView contentContainerStyle={styles.sheetBody}>
        <View style={styles.tileGrid}>
          <DetailTile
            icon="time-outline"
            label="Duration"
            value={plan?.duration || "—"}
          />
          <DetailTile
            icon="cash-outline"
            label="Price"
            value={formatINR(plan?.price)}
          />
          <DetailTile
            icon="layers-outline"
            label="Max services"
            value={plan?.maxServices ?? "—"}
          />
          <DetailTile
            icon="calendar-outline"
            label="Subscribed on"
            value={formatDate(sub?.enterDate)}
          />
          {!!sub?.expiryRaw && (
            <DetailTile
              icon="hourglass-outline"
              label="Expires"
              value={sub.expiryRaw}
            />
          )}
        </View>
        {!!sub?.remark && (
          <View style={styles.remarkBox}>
            <View style={styles.remarkHead}>
              <Ionicons
                name="document-text-outline"
                size={13}
                color={COLORS.muted}
              />
              <Text style={styles.remarkLabel}>REMARK</Text>
            </View>
            <Text style={styles.remarkText}>{sub.remark}</Text>
          </View>
        )}
      </ScrollView>
    </Sheet>
  );
}

/* ---------- Payment sheet ---------- */

function PaymentSheet({ plan, userId, loginInfo, onClose, onSuccess }) {
  const [step, setStep] = useState("payment"); // payment | processing | success
  const [paymentError, setPaymentError] = useState("");
  const isFree = plan?.price === 0;
  const working = step === "processing";

  useEffect(() => {
    if (plan) {
      setStep("payment");
      setPaymentError("");
    }
  }, [plan]);

  const recordPayment = async (paymentFields) => {
    const historyRes = await UserPaymentHistorySave({
      userID: userId,
      payment: plan.price,
      paymentStatus: "Success",
      paymentMode: "Card",
      remark: plan.name,
      enterredBy: userId,
      enterDate: new Date().toISOString(),
      TransactionDate: new Date().toISOString(),
      isActive: 1,
      ...paymentFields,
    });
    if (!historyRes?.status)
      throw new Error(historyRes?.message || "Failed to save payment history.");

    const subRes = await userSubscriptionDetailSave({
      userID: userId,
      planID: plan.id,
      planName: plan.name,
      remark: plan.remark ?? "",
      enterredIP: "",
      enterredBy: userId,
      enterDate: new Date().toISOString(),
      isActive: 1,
    });
    if (!subRes?.status)
      throw new Error(subRes?.message || "Subscription failed.");
  };

  const handlePay = async () => {
    setPaymentError("");
    setStep("processing");
    try {
      if (isFree) {
        await recordPayment({});
      } else {
        const response = await openRazorpay({
          key: "rzp_test_TBIngVA6fjYaLH",
          amount: Math.round(plan.price * 100), // paise
          currency: "INR",
          name: "Contracts India",
          description: plan.name,
          prefill: {
            name: loginInfo?.userName || "",
            email: loginInfo?.emailId || "",
            contact: loginInfo?.mobileNo || "",
          },
          theme: { color: COLORS.primary },
        });
        await recordPayment({
          TransactionID: response?.razorpay_payment_id ?? "",
        });
      }
      setStep("success");
    } catch (error) {
      // Razorpay reports a cancelled checkout with code 0.
      if (error?.code === 0) {
        setStep("payment");
        return;
      }
      setStep("payment");
      setPaymentError(
        error?.description || error?.message || "Payment failed.",
      );
    }
  };

  return (
    <Sheet
      visible={!!plan}
      onClose={onClose}
      dismissable={!working && step !== "success"}
      header={
        <View style={[styles.heroHeader, { backgroundColor: COLORS.primary }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.heroEyebrow}>
              <Ionicons name="card" size={12} color="#FDE68A" />
              <Text style={styles.heroEyebrowText}>Checkout</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {plan?.name}
            </Text>
            <Text style={styles.heroSub}>{plan?.duration || ""}</Text>
          </View>
          {!working && step !== "success" && (
            <SheetCloseBtn onPress={onClose} />
          )}
        </View>
      }
      footer={
        step === "payment" ? (
          <>
            <ActionBtn icon="close-outline" label="Cancel" onPress={onClose} />
            <ActionBtn
              icon={isFree ? "gift-outline" : "lock-closed-outline"}
              label={
                isFree ? "Activate free plan" : `Pay ${formatINR(plan?.price)}`
              }
              variant="primary"
              onPress={handlePay}
            />
          </>
        ) : step === "success" ? (
          <ActionBtn
            icon="checkmark"
            label="Done"
            variant="primary"
            onPress={onSuccess}
          />
        ) : null
      }
    >
      <View style={styles.sheetBody}>
        {step === "payment" && (
          <>
            {!!paymentError && (
              <View style={styles.paymentError}>
                <Ionicons name="alert-circle" size={18} color={COLORS.red} />
                <Text style={styles.paymentErrorText}>{paymentError}</Text>
              </View>
            )}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.amountValue}>
                {isFree ? "Free" : formatINR(plan?.price)}
              </Text>
              <Text style={styles.amountSub}>
                Max {plan?.maxServices ?? 0} services
              </Text>
            </View>

            {isFree ? (
              <View style={styles.notice}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={COLORS.green}
                />
                <Text style={[styles.noticeText, { color: COLORS.green }]}>
                  This plan is free. No payment required.
                </Text>
              </View>
            ) : (
              <View style={[styles.notice, styles.noticeInfo]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={COLORS.primary}
                />
                <Text
                  style={[styles.noticeText, { color: COLORS.primaryDark }]}
                >
                  You will complete payment in the secure Razorpay checkout.
                </Text>
              </View>
            )}
          </>
        )}

        {step === "processing" && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateTitle}>Processing your payment…</Text>
            <Text style={styles.stateText}>Please don't close the app.</Text>
          </View>
        )}

        {step === "success" && (
          <View style={styles.centerState}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={36} color={COLORS.green} />
            </View>
            <Text style={styles.stateTitle}>Subscription activated</Text>
            <Text style={styles.stateText}>
              You are now subscribed to {plan?.name}.
            </Text>
          </View>
        )}
      </View>
    </Sheet>
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

export default function PlansAndSubscriptionsScreen({ onBack }) {
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const columns = width >= 720 ? 2 : 1;
  const loginResponce = useAuthStore((s) => s?.user);
  const userId = loginResponce?.userId;
  const userType = loginResponce?.userType;

  const [tab, setTab] = useState("plans");
  const [detailPlan, setDetailPlan] = useState(null);
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [detailSub, setDetailSub] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback(
    (type, message) => setToast({ type, message, key: Date.now() }),
    [],
  );
  const hideToast = useCallback(() => setToast(null), []);

  /* ── Queries ── */
  const {
    data: rawPlans,
    isLoading: plansLoading,
    isFetching: plansFetching,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ["planMasterGetById", userType],
    queryFn: () => fetchPlans(userType),
    enabled: !!userType,
    retry: 1,
  });

  const {
    data: rawSubs,
    isLoading: subsLoading,
    isFetching: subsFetching,
    refetch: refetchSubs,
  } = useQuery({
    queryKey: ["subscriptionHistory", userId],
    queryFn: () => fetchSubscriptions(userId),
    enabled: !!userId,
    retry: 1,
  });

  const plans = useMemo(() => (rawPlans ?? []).map(normalizePlan), [rawPlans]);
  const subs = useMemo(() => (rawSubs ?? []).map(normalizeSub), [rawSubs]);

  const planById = useMemo(() => {
    const map = {};
    plans.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [plans]);

  const activeSub = subs[0] && subStatus(subs[0]) === "active" ? subs[0] : null;

  const refreshAll = useCallback(() => {
    refetchPlans();
    refetchSubs();
  }, [refetchPlans, refetchSubs]);

  const handlePaymentSuccess = useCallback(() => {
    setPaymentPlan(null);
    queryClient.invalidateQueries({
      queryKey: ["subscriptionHistory", userId],
    });
    queryClient.invalidateQueries({
      queryKey: ["planMasterGetById", userType],
    });
    showToast("success", "Subscription saved.");
  }, [queryClient, userId, userType, showToast]);

  const isTabLoading = tab === "plans" ? plansLoading : subsLoading;
  const isTabFetching = tab === "plans" ? plansFetching : subsFetching;
  const count = tab === "plans" ? plans.length : subs.length;

  const openPay = useCallback((plan) => {
    setDetailPlan(null);
    setPaymentPlan(plan);
  }, []);

  /* ── List header ── */
  const listHeader = (
    <View style={styles.listHead}>
      {!!activeSub && (
        <Pressable
          onPress={() => setDetailSub(activeSub)}
          style={({ pressed }) => [
            styles.activeBanner,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.activeIcon}>
            <Ionicons name="star" size={16} color={COLORS.green} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.activeTitle} numberOfLines={1}>
              Active: {activeSub.planName}
            </Text>
            <Text style={styles.activeSub} numberOfLines={1}>
              Subscription #{activeSub.id} · since{" "}
              {formatDate(activeSub.enterDate)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.green} />
        </Pressable>
      )}

      <View style={styles.segment}>
        {[
          { key: "plans", label: "Available plans", icon: "diamond-outline" },
          {
            key: "subscriptions",
            label: "My subscriptions",
            icon: "ribbon-outline",
          },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.segmentItem, active && styles.segmentActive]}
            >
              <Ionicons
                name={t.icon}
                size={14}
                color={active ? COLORS.primary : COLORS.muted}
              />
              <Text
                style={[
                  styles.segmentText,
                  active && { color: COLORS.primary },
                ]}
                numberOfLines={1}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHead}>
        <Ionicons
          name={tab === "plans" ? "diamond-outline" : "ribbon-outline"}
          size={15}
          color={COLORS.primary}
        />
        <Text style={styles.sectionTitle}>
          {tab === "plans" ? "AVAILABLE PLANS" : "MY SUBSCRIPTIONS"}
        </Text>
        {!isTabLoading && <Text style={styles.sectionCount}>{count}</Text>}
      </View>
    </View>
  );

  const emptyState = isTabLoading ? (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.stateText}>Loading…</Text>
    </View>
  ) : (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="file-tray-outline" size={26} color={COLORS.faint} />
      </View>
      <Text style={styles.stateTitle}>
        {tab === "plans" ? "No plans available" : "No subscriptions yet"}
      </Text>
      <Text style={styles.stateText}>
        {tab === "plans"
          ? "Plans for your account type will appear here."
          : "Subscribe to a plan to see it here."}
      </Text>
    </View>
  );

  const listData = isTabLoading ? [] : tab === "plans" ? plans : subs;
  const handleBack = () => {
    onBack?.();
  };
  return (
    <Screen>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />

      <ScreenHeader
        title="Plans & Subscriptions"
        subtitle="Browse plans and manage your history"
        icon="briefcase"
        showBack
        onBack={handleBack}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh plans and subscriptions"
            onPress={refreshAll}
            disabled={isTabFetching && !isTabLoading}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.ink} />
          </Pressable>
        }
      />

      <FlatList
        key={`${tab}-${columns}`}
        data={listData}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.colWrap : undefined}
        keyExtractor={(item) =>
          String(item.id ?? item.raw?.PlanID ?? item.raw?.SubscriptionID)
        }
        renderItem={({ item }) => (
          <View style={columns > 1 ? styles.half : null}>
            {tab === "plans" ? (
              <PlanCard
                plan={item}
                onView={() => setDetailPlan(item)}
                onSubscribe={() => openPay(item)}
              />
            ) : (
              <SubCard sub={item} onView={() => setDetailSub(item)} />
            )}
          </View>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isTabFetching && !isTabLoading}
            onRefresh={refreshAll}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      <PlanDetailSheet
        plan={detailPlan}
        onClose={() => setDetailPlan(null)}
        onSubscribe={openPay}
      />

      <SubscriptionDetailSheet
        sub={detailSub}
        plan={detailSub ? planById[detailSub.planId] : null}
        onClose={() => setDetailSub(null)}
      />

      <PaymentSheet
        plan={paymentPlan}
        userId={userId}
        loginInfo={loginResponce}
        onClose={() => setPaymentPlan(null)}
        onSuccess={handlePaymentSuccess}
      />

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
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.greenLine,
  },
  activeIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  activeTitle: { color: "#047857", fontSize: 13, fontWeight: "800" },
  activeSub: { color: COLORS.green, fontSize: 11, marginTop: 2 },

  segment: {
    flexDirection: "row",
    padding: 5,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  segmentActive: {
    backgroundColor: COLORS.surface,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  segmentText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },

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

  /* Cards */
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#E0E7FF",
    elevation: 3,
    shadowColor: "#64748B",
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  cardIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: "#172554", fontSize: 17, fontWeight: "900" },
  cardSub: { color: COLORS.muted, fontSize: 12, marginTop: 4, fontWeight: "500" },

  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: 18,
  },
  price: { color: COLORS.primaryDark, fontSize: 30, fontWeight: "900" },
  priceUnit: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    marginBottom: 18,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.slateLight,
    maxWidth: "100%",
  },
  chipViolet: { backgroundColor: "#F3E8FF" },
  chipText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: "800" },

  subMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
    marginBottom: 14,
  },
  subMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  subMetaText: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },

  iconBtn: {
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: "#DCE3FF",
  },
  actionBtn: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  actionPrimary: {
    backgroundColor: COLORS.primary,
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  actionGhost: {
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#D8DEFF",
  },
  actionText: { fontSize: 14, fontWeight: "800", letterSpacing: 0.2 },

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

  /* Sheets */
  sheetRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.6)",
  },
  sheet: {
    maxHeight: "90%",
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    paddingBottom: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginVertical: 8,
    position: "absolute",
    top: 8,
    zIndex: 2,
  },
  sheetBody: { padding: 18, gap: 14 },
  sheetFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },

  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  heroEyebrowText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 },
  heroPriceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: 12,
  },
  heroPrice: { color: "#fff", fontSize: 32, fontWeight: "900" },
  heroPriceUnit: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginBottom: 6,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  heroPillText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
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

  remarkBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  remarkHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  remarkLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  remarkText: { color: COLORS.ink, fontSize: 13, lineHeight: 19 },

  /* Payment */
  amountCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    gap: 4,
  },
  amountLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  amountValue: { color: "#fff", fontSize: 34, fontWeight: "900" },
  amountSub: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.greenLine,
  },
  noticeInfo: { backgroundColor: COLORS.primaryLight, borderColor: "#C7D2FE" },
  noticeText: { flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  paymentError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.redLight,
    borderWidth: 1,
    borderColor: COLORS.redLine,
  },
  paymentErrorText: {
    flex: 1,
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "700",
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
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
