import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  ScreenHeader,
  Card,
  Badge,
  Input,
  EmptyState,
} from "@/components";
import { colors } from "@/constants/colors";
import { radius, spacing, typography } from "@/constants/sizes";
import { formatINR } from "@/utils/formatters";
import { getUserPaymentHistory, UserPaymentHistoryGetId } from "../../api/api";
import { useAuthStore } from "@/store/authStore";
const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "Success", label: "Success" },
  { key: "Pending", label: "Pending" },
  { key: "Failed", label: "Failed" },
  { key: "Refunded", label: "Refunded" },
];

function statusTone(status) {
  switch (String(status ?? "").toLowerCase()) {
    case "success":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "danger";
    case "refunded":
    case "free":
      return "info";
    default:
      return "default";
  }
}

function formatAmount(value) {
  if (value == null || value === "") return "\u2014";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return amount === 0 ? "Free" : formatINR(amount);
}

function formatDate(value) {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PaymentsScreen() {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [payments, setPayments] = useState([]);
  const [detailRecord, setDetailRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const user = useAuthStore((s) => s?.user);
  const userType = user?.userType ?? 0;
  const loadPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response =
        user?.userType == 0
          ? await getUserPaymentHistory()
          : await UserPaymentHistoryGetId(
              `userId=${encodeURIComponent(user?.userId)}`,
            );
      const records = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.value)
            ? response.value
            : [];
      setPayments(records);
    } catch (requestError) {
      setError(requestError?.message || "Could not load payment history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const data = useMemo(() => {
    const s = q.trim().toLowerCase();
    return payments.filter((payment) => {
      if (
        filter !== "all" &&
        String(payment?.PaymentStatus ?? "").toLowerCase() !==
          filter.toLowerCase()
      )
        return false;
      if (!s) return true;
      return [
        payment?.UserID,
        payment?.Name,
        payment?.EmailId,
        payment?.UserTypeName,
        payment?.TransactionID,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(s),
      );
    });
  }, [payments, filter, q]);

  const totals = useMemo(() => {
    const sumFor = (status) =>
      payments
        .filter(
          (payment) =>
            String(payment?.PaymentStatus ?? "").toLowerCase() === status,
        )
        .reduce((sum, payment) => sum + (Number(payment?.Payment) || 0), 0);
    return {
      total: payments.reduce(
        (sum, payment) => sum + (Number(payment?.Payment) || 0),
        0,
      ),
      successful: payments.filter(
        (payment) =>
          String(payment?.PaymentStatus ?? "").toLowerCase() === "success",
      ).length,
      pending: payments.filter(
        (payment) =>
          String(payment?.PaymentStatus ?? "").toLowerCase() === "pending",
      ).length,
      failed: payments.filter(
        (payment) =>
          String(payment?.PaymentStatus ?? "").toLowerCase() === "failed",
      ).length,
      successAmount: sumFor("success"),
    };
  }, [payments]);

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>Loading payment history...</Text>
        </View>
      );
    }
    if (error && payments.length === 0) {
      return (
        <EmptyState
          icon="cloud-offline-outline"
          title="Payment history unavailable"
          body={error}
          action={
            <Pressable
              onPress={() => loadPayments()}
              style={styles.retryButton}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          }
        />
      );
    }
    return (
      <EmptyState
        icon="receipt-outline"
        title="No payments found"
        body="Try changing the search or status filter."
      />
    );
  };

  return (
    <Screen>
      <ScreenHeader
        title="Payment History"
        subtitle={
          loading ? "Loading records" : `${payments.length} payment records`
        }
        showBack
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh payment history"
            onPress={() => loadPayments(true)}
            disabled={refreshing}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.text} />
          </Pressable>
        }
      />
      {error && payments.length > 0 ? (
        <View style={styles.errorBanner}>
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color={colors.danger}
          />
          <Text style={styles.errorText} numberOfLines={2}>
            {error}
          </Text>
          <Pressable onPress={() => loadPayments(true)} hitSlop={8}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={data}
        keyExtractor={(item, index) =>
          String(
            item?.PaymentID ??
              item?.TransactionID ??
              `${item?.UserID ?? "payment"}-${index}`,
          )
        }
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPayments(true)}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {user?.userType == 0 && (
              <View style={styles.statsGrid}>
                <StatCard
                  label="Total revenue"
                  value={formatINR(totals.total)}
                  icon="cash-outline"
                  color={colors.primary}
                />
                <StatCard
                  label="Successful"
                  value={`${totals.successful}`}
                  detail={`${formatINR(totals.successAmount)} collected`}
                  icon="checkmark-circle-outline"
                  color={colors.success}
                />
                <StatCard
                  label="Pending"
                  value={`${totals.pending}`}
                  icon="time-outline"
                  color={colors.warning}
                />
                <StatCard
                  label="Failed"
                  value={`${totals.failed}`}
                  icon="close-circle-outline"
                  color={colors.danger}
                />
              </View>
            )}
            <Input
              placeholder="Search user, email, ID or transaction"
              value={q}
              onChangeText={setQ}
              leftIcon={
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.textMuted}
                />
              }
            />
            <View style={styles.chips}>
              {STATUS_FILTERS.map((item) => {
                const selected = filter === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setFilter(item.key)}
                    style={[styles.chip, selected && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.resultCount}>
              {data.length} of {payments.length} records
            </Text>
          </View>
        }
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <PaymentCard item={item} onPress={() => setDetailRecord(item)} />
        )}
      />
      <PaymentDetailModal
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
      />
    </Screen>
  );
}

function StatCard({ label, value, detail, icon, color }) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {detail ? (
        <Text style={styles.statDetail} numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
    </Card>
  );
}

function PaymentCard({ item, onPress }) {
  return (
    <Card style={styles.paymentCard}>
      <View style={styles.paymentTop}>
        <View style={styles.paymentIdentity}>
          <Text style={styles.userName} numberOfLines={1}>
            {item?.Name || `User ${item?.UserID ?? ""}`}
          </Text>
          {item?.EmailId ? (
            <Text style={styles.muted} numberOfLines={1}>
              {item.EmailId}
            </Text>
          ) : null}
          <Text style={styles.muted} numberOfLines={1}>
            ID {item?.UserID ?? "\u2014"}
            {item?.UserTypeName ? ` \u00B7 ${item.UserTypeName}` : ""}
          </Text>
        </View>
        <View style={styles.amountStatus}>
          <Text style={styles.amount}>{formatAmount(item?.Payment)}</Text>
          <Badge
            label={item?.PaymentStatus || "Unknown"}
            tone={statusTone(item?.PaymentStatus)}
          />
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.paymentMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Payment date</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {formatDate(item?.PaymentDate)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Mode</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {item?.PaymentMode || "\u2014"}
          </Text>
        </View>
      </View>
      {item?.TransactionID ? (
        <Text style={styles.transactionId} numberOfLines={1}>
          Transaction: {item.TransactionID}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={styles.detailAction}
      >
        <Ionicons name="eye-outline" size={16} color={colors.primary} />
        <Text style={styles.detailActionText}>View details</Text>
      </Pressable>
    </Card>
  );
}

function PaymentDetailModal({ record, onClose }) {
  if (!record) return null;
  const rows = [
    ["Payment ID", record.PaymentID],
    ["User ID", record.UserID],
    ["Name", record.Name],
    ["Email", record.EmailId],
    ["User type", record.UserTypeName],
    ["Amount", formatAmount(record.Payment)],
    ["Status", record.PaymentStatus],
    ["Payment mode", record.PaymentMode],
    ["Transaction ID", record.TransactionID],
    ["Payment date", formatDate(record.PaymentDate)],
    ["Transaction date", formatDate(record.TransactionDate)],
    ["Entered", formatDate(record.EnterDate)],
    ["Remark", record.Remark],
  ];
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close payment details"
          style={styles.modalBackdrop}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalEyebrow}>PAYMENT DETAILS</Text>
              <Text style={styles.modalTitle} numberOfLines={1}>
                #{record.PaymentID ?? record.UserID ?? "\u2014"}
              </Text>
              <Text style={styles.modalAmount}>
                {formatAmount(record.Payment)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={21} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.detailRows}>
            {rows.map(([label, value]) => (
              <View key={label} style={styles.detailRow}>
                <Text style={styles.metaLabel}>{label}</Text>
                {label === "Status" ? (
                  <Badge label={value || "Unknown"} tone={statusTone(value)} />
                ) : (
                  <Text style={styles.detailValue}>
                    {value == null || value === "" ? "\u2014" : String(value)}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
          <Pressable onPress={onClose} style={styles.modalDone}>
            <Text style={styles.modalDoneText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: { width: "48%", flexGrow: 1, minHeight: 116, padding: spacing.md },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  statLabel: { ...typography.small, color: colors.textMuted },
  statValue: { ...typography.h3, color: colors.text, marginTop: 2 },
  statDetail: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.small, color: colors.text, fontWeight: "600" },
  chipTextActive: { color: colors.textInverse },
  resultCount: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  paymentCard: { marginBottom: spacing.sm },
  paymentTop: { flexDirection: "row", alignItems: "flex-start" },
  paymentIdentity: { flex: 1, marginRight: spacing.sm },
  userName: { ...typography.bodyBold, color: colors.text },
  muted: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  amountStatus: { alignItems: "flex-end", gap: spacing.xs },
  amount: { ...typography.bodyBold, color: colors.primary },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  paymentMeta: { flexDirection: "row", gap: spacing.md },
  metaItem: { flex: 1 },
  metaLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "700",
    marginBottom: 3,
  },
  metaValue: { ...typography.small, color: colors.text },
  transactionId: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  detailAction: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  detailActionText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: "700",
  },
  emptyLoading: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: "#FEE2E2",
  },
  errorText: { ...typography.small, color: colors.danger, flex: 1 },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  retryText: { ...typography.small, color: colors.primary, fontWeight: "700" },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.62)",
  },
  modalContent: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "86%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
    backgroundColor: colors.surfaceAlt,
  },
  modalEyebrow: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: "700",
  },
  modalTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xs },
  modalAmount: {
    ...typography.h2,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  detailRows: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  detailRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailValue: { ...typography.body, color: colors.text, marginTop: 3 },
  modalDone: {
    alignItems: "center",
    margin: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  modalDoneText: { ...typography.bodyBold, color: colors.text },
});
