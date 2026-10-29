import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import ScreenHeader from "../../components/ScreenHeader";
import {
  companyImageUrl,
  fetchVerifiedCompanies,
  initialOf,
  toCompanyCard,
} from "../../services/companyService";
import { COLORS, FALLBACK_PALETTE } from "../../constants/colors";

// Same query key as the web page, so the cache is shared.
export function useVerifiedCompanies() {
  return useQuery({
    queryKey: [
      "userRegistrationDetailsGetApi",
      { isVerifiedByAdmin: 1, userType: 2 },
    ],
    queryFn: fetchVerifiedCompanies,
    select: (rows) => rows.map(toCompanyCard),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function CompanyCard({ item, index, onPress, style }) {
  const [imgFailed, setImgFailed] = useState(false);
  const pal = FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
  const approved = item.status === "Approved";
  const uri = companyImageUrl(item.userId);

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.name}`}
      style={({ pressed }) => [
        styles.card,
        style,
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View
        style={[
          styles.accent,
          { backgroundColor: approved ? COLORS.indigo : COLORS.amber },
        ]}
      />

      <View style={styles.cover}>
        {uri && !imgFailed ? (
          <Image
            source={{ uri }}
            style={styles.coverImg}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <View style={[styles.coverFallback, { backgroundColor: pal.bg }]}>
            <Text style={[styles.initial, { color: pal.fg }]}>
              {initialOf(item.name)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name || "Company"}
        </Text>
        {!!item.type && (
          <Text style={styles.type} numberOfLines={1}>
            {item.type}
          </Text>
        )}
        {!!item.loc && (
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.faint} />
            <Text style={styles.loc} numberOfLines={1}>
              {item.loc}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function StateView({ icon, title, text, action, onAction, loading }) {
  return (
    <View style={styles.state}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <View style={styles.stateIcon}>
          <Ionicons name={icon} size={26} color={COLORS.faint} />
        </View>
      )}
      {!!title && <Text style={styles.stateTitle}>{title}</Text>}
      {!!text && <Text style={styles.stateText}>{text}</Text>}
      {!!action && (
        <Pressable onPress={onAction} style={styles.retry}>
          <Ionicons name="reload-outline" size={14} color="#fff" />
          <Text style={styles.retryText}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function CompanyListScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const columns = width >= 1100 ? 4 : width >= 720 ? 3 : 2;
  const {
    data = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useVerifiedCompanies();

  const openCompany = useCallback(
    (c) => {
      if (c.userId)
        navigation.navigate("CompanyDetail", {
          userId: c.userId,
          name: c.name,
        });
    },
    [navigation],
  );

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />

      <ScreenHeader
        title="Verified Industry Leaders"
        subtitle={isLoading ? "Loading…" : `${data.length} verified companies`}
        icon="shield-checkmark"
        showBack={handleBack}
      />

      {isLoading ? (
        <StateView loading title="Loading companies…" />
      ) : isError ? (
        <StateView
          icon="cloud-offline-outline"
          title="Could not load companies"
          text="Check your connection and try again."
          action="Retry"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          key={`cols-${columns}`}
          data={data}
          numColumns={columns}
          keyExtractor={(item, i) => String(item.userId ?? i)}
          columnWrapperStyle={columns > 1 ? styles.row : undefined}
          renderItem={({ item, index }) => (
            <CompanyCard
              item={item}
              index={index}
              onPress={openCompany}
              style={styles.cell}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <StateView
              icon="business-outline"
              title="No verified companies found"
              text="Companies appear here once they are verified."
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => refetch()}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

/* Home-page section: the first `limit` companies in a 2-column grid,
   with a "View more" action that opens the full list. */
export function CompanyPreview({   onViewMore }) {
  const navigation = useNavigation();
  const { data = [], isLoading, isError } = useVerifiedCompanies();

  if (isLoading) return null;
  if (isError || data.length === 0) return null;

  const items = data;

  return (
    <View style={styles.preview}>
      <View style={styles.previewHead}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>✦ TOP RATED</Text>
          </View>
          <Text style={styles.previewTitle}>
            Verified{" "}
            <Text style={{ color: COLORS.primary }}>Industry Leaders</Text>
          </Text>
          <Text style={styles.previewSub}>
            Work with the top-rated contractors and consultants in the region.
          </Text>
        </View>
        {!!onViewMore && (
          <Pressable onPress={onViewMore} style={styles.viewMore}>
            <Text style={styles.viewMoreText}>View more</Text>
            <Ionicons name="arrow-forward" size={13} color={COLORS.primary} />
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        {items.map((item, index) => (
          <CompanyCard
            key={String(item.userId ?? index)}
            item={item}
            index={index}
            style={styles.gridCell}
            onPress={(c) =>
              c.userId &&
              navigation.navigate("CompanyDetail", {
                userId: c.userId,
                name: c.name,
              })
            }
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  list: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  row: { gap: 12 },
  cell: { flex: 1, marginBottom: 12 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: "hidden",
    elevation: 1,
  },
  accent: { height: 3 },
  cover: { height: 120, backgroundColor: COLORS.slateLight },
  coverImg: { width: "100%", height: "100%" },
  coverFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  initial: { fontSize: 36, fontWeight: "900" },
  body: { padding: 12, gap: 3 },
  name: { color: COLORS.slate, fontSize: 14, fontWeight: "800", minHeight: 36 },
  type: { color: COLORS.faint, fontSize: 11, fontWeight: "600" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  loc: { flex: 1, color: COLORS.faint, fontSize: 11 },

  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.slateLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
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
  retry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  preview: { paddingHorizontal: 16, paddingVertical: 24 },
  previewHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 16,
  },
  topBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.greenLine,
    marginBottom: 8,
  },
  topBadgeText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  previewTitle: { color: COLORS.ink, fontSize: 22, fontWeight: "900" },
  previewSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  viewMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.indigoLine,
    backgroundColor: COLORS.surface,
  },
  viewMoreText: { color: COLORS.primary, fontSize: 12, fontWeight: "800" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCell: { width: "48%", marginBottom: 12 },
});
