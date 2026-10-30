import {
  ChevronRight,
  ChevronLeft,
  GripVertical,
  Layers3,
  EyeOff,
  Zap,
  ChevronDown,
  Loader,
  Crown,
  Plus,
  X,
  IndianRupee,
  Clock,
  Layers,
  Users,
  CheckCircle2,
  Calendar,
  Star,
  Eye,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useUserStore } from "../../../../store/store";
import { useProfileWizardStore } from "../../../../store/profileWizardStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getUserServicesByParam,
  UserSubscriptionDetailGet,
  UserServiceDetailsSave,
  UserServiceDetailsUpdate,
  planMasterGetById,
} from "../../../../services/api";
import SubscriptionPlansFlow from "../SubscriptionPlansFlow";

// ─── API helpers ───────────────────────────────────────────────────────────────
const fetchUserServices = async (userId) => {
  const response = await getUserServicesByParam(`userId=${userId}`);
  return response?.data ?? [];
};

const fetchUserSubscriptions = async (userId) => {
  const response = await UserSubscriptionDetailGet(`userId=${userId}`);
  return response?.data ?? [];
};

const fetchPlans = async (userType) => {
  const res = await planMasterGetById(`userType=${userType}`);
  return res?.data ?? [];
};
const CheckValidityGet = async (userId) => {
  const response = await CheckValidityGet(`userId=${userId}`);
  return response ?? [];
};
// ─── Color palette ─────────────────────────────────────────────────────────────
const colorMap = {
  violet: {
    border: "#c4b5fd",
    bg: "#f5f3ff",
    text: "#7c3aed",
    glow: "rgba(124,58,237,0.4)",
  },
};
const COLOR_KEYS = Object.keys(colorMap);

// ─── Map flat API list → nested tree ──────────────────────────────────────────
const mapFlatToTree = (flat = []) => {
  const nodes = {};
  flat.forEach((it, idx) => {
    const id = String(it.ServiceID);
    nodes[id] = {
      id,
      serviceId: it.ServiceID,
      parentId: it.ParentServiceID,
      code: it.ServiceCode,
      name: it.ServiceName || it.ServiceCode || `Service ${it.ServiceID}`,
      description: it.ServiceDescription,
      icon: it.ServiceIcon || null,
      planId: it.PlanID,
      planName: it.PlanName,
      amount: it.Amount,
      isActive: !!Number(it.IsActive),
      userServiceId: it.UserServiceID ?? 0,
      color: COLOR_KEYS[idx % COLOR_KEYS.length],
      children: [],
    };
  });
  const roots = [];
  Object.values(nodes).forEach((n) => {
    const parentKey = String(n.parentId || 0);
    if (n.parentId && nodes[parentKey]) {
      nodes[parentKey].children.push(n);
    } else {
      roots.push(n);
    }
  });
  return roots;
};

// ─── Count all nested children ─────────────────────────────────────────────────
const countTotalChildren = (item) => {
  const children = item?.subServices || item?.children || [];
  return children.reduce((acc, c) => acc + 1 + countTotalChildren(c), 0);
};

// ─── Formatters ────────────────────────────────────────────────────────────────
const formatPrice = (price) => {
  if (price == null || price === "") return "—";
  const num = Number(price);
  if (isNaN(num)) return price;
  return num === 0 ? "Free" : `₹${num?.toLocaleString("en-IN")}`;
};

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

// ─── Confirmation Modal ─────────────────────────────────────────────────────────
function ActivateServiceModal({
  service,
  plan,
  onConfirm,
  onCancel,
  isLoading,
}) {
  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1001] flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
          onClick={onCancel}
        />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black">Activate Service?</h2>
                <p className="text-indigo-200 text-xs mt-1">
                  Confirm to activate this service
                </p>
              </div>
              <button
                onClick={onCancel}
                className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Service Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Service
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {service?.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {service?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Details */}
            {plan && (
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-200">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                  Required Plan
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      Plan Name
                    </span>
                    <span className="font-bold text-indigo-700">
                      {plan?.PlanName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      Price
                    </span>
                    <span className="font-bold text-indigo-700">
                      {formatPrice(plan?.Price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      Duration
                    </span>
                    <span className="font-bold text-indigo-700">
                      {plan?.DurationType}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" /> Activating…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" /> Confirm & Activate
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}

// ─── Plan Detail Modal (from Available Plans) ─────────────────────────────────
function PlanDetailModal({ plan, onClose, onSubscribe }) {
  const price = plan?.Price ?? 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1001] flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
        >
          {/* Header gradient */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-4 w-4 text-yellow-300" />
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">
                    {plan?.DurationType ?? "Plan"}
                  </span>
                </div>
                <h2 className="text-2xl font-black">
                  {plan?.PlanName ?? "Plan"}
                </h2>
                <p className="text-indigo-200 text-xs mt-1">
                  {plan?.Remark ?? ""}
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-end gap-1">
              <IndianRupee className="h-6 w-6 mb-0.5 text-white/80" />
              <span className="text-4xl font-black">
                {price === 0 ? "Free" : price?.toLocaleString("en-IN")}
              </span>
              {price > 0 && (
                <span className="text-indigo-200 text-sm mb-1">
                  / {plan?.DurationType?.toLowerCase() ?? "period"}
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: Clock,
                  label: "Duration",
                  value: plan?.DurationType ?? "—",
                },
                {
                  icon: Layers,
                  label: "Max Services",
                  value: plan?.maxNoofServices ?? "—",
                },
                {
                  icon: Users,
                  label: "User Type",
                  value: plan?.UserTypeName || "All",
                },
                {
                  icon: CheckCircle2,
                  label: "Status",
                  value: Number(plan?.IsActive) === 1 ? "Active" : "Inactive",
                  color:
                    Number(plan?.IsActive) === 1
                      ? "text-emerald-600"
                      : "text-slate-400",
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p
                      className={`text-xs font-bold truncate ${color ?? "text-slate-800"}`}
                    >
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSubscribe(plan)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg hover:opacity-90 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Subscribe
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
const Step5ServiceListing = ({ store, nextStep, prevStep, navbar = false }) => {
  const { loginResponce } = useUserStore();
  const userId = loginResponce?.userId;
  const userType = loginResponce?.userType;

  // ── Fetch services ──────────────────────────────────────────────────────────
  const { data: rawServices = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["userServices", userId],
    queryFn: () => fetchUserServices(userId),
    enabled: !!userId,
    retry: false,
  });

  // ── Fetch subscriptions ─────────────────────────────────────────────────────
  const {
    data: subscriptions = [],
    isLoading: subscriptionsLoading,
    refetch: refetchSubscriptions,
  } = useQuery({
    queryKey: ["userSubscriptions", userId],
    queryFn: () => fetchUserSubscriptions(userId),
    enabled: !!userId,
    retry: false,
  });

  // ── Fetch available plans ───────────────────────────────────────────────────
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["planMasterGetById", userType],
    queryFn: () => fetchPlans(userType),
    enabled: !!userType,
    retry: false,
  });

  // ── Plan map for quick lookup ───────────────────────────────────────────────
  const planMap = useMemo(() => {
    const map = {};
    plans?.forEach((p) => {
      map[p?.PlanID] = p;
    });
    return map;
  }, [plans]);

  // ── Derive active plan ──────────────────────────────────────────────────────
  const latestSub = subscriptions[0] ?? null;
  const hasActivePlan = latestSub?.IsActive === 1;
  const maxServicesAllowed = Number(latestSub?.maxNoofServices ?? 0);

  // ── Build tree & initial active ids from API ────────────────────────────────
  const [services, setServices] = useState([]);
  const [activeIds, setActiveIds] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);
  const [showPlans, setShowPlans] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState({});
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    service: null,
    plan: null,
  });
  const [detailPlan, setDetailPlan] = useState(null);
  const profileStore = store ?? useProfileWizardStore();

  useEffect(() => {
    if (!rawServices.length) return;
    const tree = mapFlatToTree(rawServices);
    setServices(tree);
    console.log(rawServices,"rawServices");

    // Pre-select services that are already active from API
    const alreadyActive = rawServices
      .filter((s) => Number(s.IsActive) === 1)
      .map((s) => String(s.ServiceID));
    setActiveIds(alreadyActive);
  }, [rawServices]);

  // ── Save service mutation ───────────────────────────────────────────────────
  const { mutateAsync: saveService } = useMutation({
    mutationFn: UserServiceDetailsSave,
    onSuccess: (response) => {
      if (response?.status) {
        toast.success(response?.message || "Service activated successfully");
        refetchSubscriptions();
      } else {
        toast.error(
          response?.message || "Failed to activate service. Please try again.",
        );
      }
    },
    onError: (error) => {
      toast.error(
        error?.message || "Failed to activate service. Please try again.",
      );
    },
  });

  const { mutateAsync: updateService } = useMutation({
    mutationFn: UserServiceDetailsUpdate,
    onSuccess: (response) => {
      if (response?.status) {
        toast.success(response?.message || "Service activated successfully");
        refetchSubscriptions();
      } else {
        toast.error(
          response?.message || "Failed to activate service. Please try again",
        );
      }
    },
    onError: (error) => {
      toast.error(
        error?.message || "Failed to activate service. Please try again.",
      );
    },
  });

  // ── Toggle active with confirmation modal ────────────────────────────────
  const toggleActive = async (item) => {
    const id = item?.id;
    const isCurrentlyActive = activeIds.includes(id);

    // Activated services can't be turned back off
    if (isCurrentlyActive) {
      toast.error("Activated services cannot be deactivated.");
      return;
    }

    if (!hasActivePlan) {
      toast.error(
        "An active subscription plan is required to activate services.",
      );
      setShowPlans(true);
      return;
    }

    // Enforce max services allowed by the subscription
    if (maxServicesAllowed > 0 && activeIds.length >= maxServicesAllowed) {
      toast.error(
        `You've reached the maximum of ${maxServicesAllowed} active service${
          maxServicesAllowed !== 1 ? "s" : ""
        } allowed on your plan.`,
      );
      // Show current plan details
      setDetailPlan(planMap[latestSub?.PlanID]);
      return;
    }

    // Show confirmation modal
    setConfirmModal({
      open: true,
      service: item,
      plan: planMap[latestSub?.PlanID],
    });
  };

  // ── Confirm activation ──────────────────────────────────────────────────────
  const confirmActivation = async () => {
    const { service } = confirmModal;
    const id = service?.id;

    setToggling((prev) => ({ ...prev, [id]: true }));

    try {
      const payload = {
        userServiceID: service?.userServiceId ?? 0,
        userID: userId,
        serviceID: service?.serviceId,
        serviceName: service?.name,
        planID: latestSub?.PlanID ?? service?.planId ?? 0,
        planName: latestSub?.PlanName ?? service?.planName ?? "",
        amount: service?.amount ?? 0,
        enterredBy: userId,
        isActive: 1,
      };

      // Wait for API response before updating UI
      const response =
        payload?.userServiceID > 0
          ? await updateService(payload)
          : await saveService(payload);

      // Only update UI if API was successful
      if (response?.status) {
        setActiveIds((prev) => [...prev, id]);
        setConfirmModal({ open: false, service: null, plan: null });
      }
    } catch (err) {
      console.error("Toggle service error:", err);
    } finally {
      setToggling((prev) => ({ ...prev, [id]: false }));
    }
  };

  const toggleExpanded = (id) =>
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  // ── Save local service selections only (no API call) ───────────────────────
  const handleSave = async () => {
    if (!hasActivePlan) {
      toast.error(
        "You need an active subscription plan before saving services.",
      );
      setShowPlans(true);
      return;
    }

    setSaving(true);

    try {
      profileStore.setActiveServices?.(activeIds);
      profileStore.setExpandedServices?.(expandedIds);
      toast.success(
        `✓ ${activeIds.length} service${activeIds.length !== 1 ? "s" : ""} saved!`,
      );
      nextStep?.();
    } catch (err) {
      toast.error("Failed to save service selection. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render one service card ─────────────────────────────────────────────────
  const renderServiceItem = (item, level = 0, parentColor = "violet") => {
    const isExpanded = expandedIds.includes(item?.id);
    const isActive = activeIds.includes(item?.id);
    const isTogglingNow = toggling[item?.id];
    const hasChildren = item?.children?.length > 0;
    const children = item?.children || [];
    const color = item?.color || parentColor;
    const colors = colorMap[color];
    const indent = level * 40;

    return (
      <div key={item?.id} className="relative">
        {level > 0 && (
          <div
            className="absolute left-0 top-0 h-full w-[2px] -translate-x-6 opacity-30"
            style={{
              background: `linear-gradient(to bottom, ${colors.border}, transparent)`,
            }}
          />
        )}

        <motion.div
          whileHover={{ scale: 1.005 }}
          className={`group relative mb-3 overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
            isActive ? "bg-white" : "bg-slate-50/50"
          }`}
          style={{
            borderColor: isActive ? colors.border : "#e5e7eb",
            marginLeft: `${indent}px`,
            boxShadow: isActive
              ? `0 0 30px ${colors.glow}, 0 10px 40px -12px rgba(0,0,0,0.15)`
              : "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div className="relative p-4">
            <div className="flex items-start gap-3">
              <GripVertical className="mt-1 h-5 w-5 shrink-0 text-slate-300 group-hover:text-slate-400" />

              {hasChildren && (
                <button
                  onClick={() => toggleExpanded(item?.id)}
                  className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: isExpanded ? "#f1f5fa" : "white",
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown
                      className="h-3.5 w-3.5"
                      style={{ color: colors.text }}
                    />
                  ) : (
                    <ChevronRight
                      className="h-3.5 w-3.5"
                      style={{ color: colors.text }}
                    />
                  )}
                </button>
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {level === 0 && item?.icon && (
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                        style={{ backgroundColor: colors.bg }}
                      >
                        {item?.icon}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`font-bold text-slate-800 ${level === 0 ? "text-base" : "text-sm"}`}
                        >
                          {item?.name}
                        </h4>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                          }}
                        >
                          L{level}
                        </span>
                      </div>
                      {hasChildren && (
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Layers3 className="h-3 w-3" />
                            {children.length} items
                          </span>
                          {level === 0 && (
                            <span className="text-[10px]">
                              {countTotalChildren(item)} nested
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toggle button — disabled once active */}
                  <button
                    onClick={() => toggleActive(item)}
                    disabled={isTogglingNow || isActive}
                    className="flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 shrink-0 text-xs font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: isActive ? colors.border : "#e5e7eb",
                      backgroundColor: isActive ? colors.bg : "white",
                      color: isActive ? colors.text : "#64748b",
                      boxShadow: isActive
                        ? `0 0 20px ${colors.glow}`
                        : undefined,
                    }}
                  >
                    {isTogglingNow ? (
                      <>
                        <Loader className="h-3 w-3 animate-spin" /> Updating…
                      </>
                    ) : isActive ? (
                      <>
                        <Zap className="h-3 w-3" /> Activated
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 opacity-50" /> Click to
                        Active
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isActive && (
            <div
              className="absolute bottom-0 left-0 right-0 h-[3px]"
              style={{
                background: `linear-gradient(to right, ${colors.glow}, ${colors.text}, ${colors.glow})`,
                boxShadow: `0 0 10px ${colors.glow}`,
              }}
            />
          )}
        </motion.div>

        {isExpanded && hasChildren && (
          <div className="relative ml-6 mt-2 space-y-2 border-l-2 border-dashed border-slate-200 pl-4">
            {children.map((child) =>
              renderServiceItem(child, level + 1, color),
            )}
          </div>
        )}
      </div>
    );
  };

  const totalServices = services.reduce(
    (acc, s) => acc + 1 + countTotalChildren(s),
    0,
  );
  const isLoading = servicesLoading || subscriptionsLoading;
  console.log(latestSub, "latestSub.EnterDate");

  return (
    <div className="space-y-6 profileWizardStep">
      {/* Active plan banner */}
      {hasActivePlan ? (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <Crown className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-700">
              Active Plan: {latestSub.PlanName}
            </p>
            <p className="text-[10px] text-emerald-600">
              Subscription {latestSub.SubscriptionID} · activated{" "}
              {/* {new Date(latestSub.EnterDate).toLocaleDateString()} */}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            Plan ID {latestSub.PlanID}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-amber-700">
              No active subscription. Subscribe to activate services.
            </p>
          </div>
          <button
            onClick={() => setShowPlans(true)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 transition-colors"
          >
            View Plans
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl bg-emerald-50 px-4 py-2 border-2 border-emerald-200">
          <div className="text-xs font-medium text-emerald-600">
            Active Services
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {activeIds?.length}
            {maxServicesAllowed > 0 ? (
              <span className="text-sm font-semibold text-emerald-500">
                {" "}
                / {maxServicesAllowed}
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl bg-violet-50 px-4 py-2 border-2 border-violet-200">
          <div className="text-xs font-medium text-violet-600">
            Total Services
          </div>
          <div className="text-2xl font-black text-violet-700">
            {totalServices}
          </div>
        </div>
      </div>

      {/* Service tree */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-slate-500">Loading services…</span>
        </div>
      ) : services.length === 0 ? (
        <div className="flex items-center justify-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-sm text-slate-400">
            No services found for your account.
          </p>
        </div>
      ) : (
        <div className="pw-section-panel">
          <div className="space-y-4">
            {services.map((s) => renderServiceItem(s))}
          </div>
        </div>
      )}

      {/* Navigation */}
      {!navbar && (
        <div className="flex justify-between gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={prevStep}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-all flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasActivePlan}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg text-white font-extrabold text-xs hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                Save & Continue <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {/* Confirmation Modal */}
        {confirmModal.open && (
          <ActivateServiceModal
            key="activate-confirmation"
            service={confirmModal.service}
            plan={confirmModal.plan}
            onConfirm={confirmActivation}
            onCancel={() =>
              setConfirmModal({ open: false, service: null, plan: null })
            }
            isLoading={toggling[confirmModal.service?.id]}
          />
        )}

        {/* Plan Detail Modal */}
        {detailPlan && (
          <PlanDetailModal
            key="plan-detail"
            plan={detailPlan}
            onClose={() => setDetailPlan(null)}
            onSubscribe={(p) => {
              setDetailPlan(null);
              setShowPlans(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Plans Flow Modal */}
      <SubscriptionPlansFlow
        open={showPlans}
        onClose={() => {
          setShowPlans(false);
          refetchSubscriptions();
        }}
      />
    </div>
  );
};

export default Step5ServiceListing;
