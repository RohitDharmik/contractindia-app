import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { useQuery } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";

import {
  companyImageUrl,
  fetchCompanyDetail,
} from "../../services/companyService";
import { COLORS } from "../../constants/colors";
import { Screen, ScreenHeader } from "../../components";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "services", label: "Services" },
  { id: "business", label: "Business details" },
];

function InfoTile({ label, value, fullWidth }) {
  return (
    <View style={[styles.tile, fullWidth && { width: "100%" }]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue} numberOfLines={2}>
        {value || "—"}
      </Text>
    </View>
  );
}

function Section({ id, icon, title, onLayout, children }) {
  return (
    <View
      style={styles.section}
      onLayout={(e) => onLayout(id, e.nativeEvent.layout.y)}
    >
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function CompanyDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userId = route.params?.userId;
  const { width } = useWindowDimensions();
  const twoCol = width >= 600;

  const [imgFailed, setImgFailed] = useState(false);
  const scrollRef = useRef(null);
  const sectionY = useRef({});

  const detailQuery = useQuery({
    queryKey: ["public-company-detail", userId],
    queryFn: () => fetchCompanyDetail(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const data = detailQuery.data ?? {};
  const company = data.registration ?? {};
  const basic = data.basic ?? {};
  const services = data.services ?? [];

  const hasProfile = !!(company.CompanyName || basic.CompanyName);
  const companyName =
    company.CompanyName || basic.CompanyName || route.params?.name || "Company";
  const location =
    basic.Address ||
    [basic.CityName, basic.StateName || company.StateName]
      .filter(Boolean)
      .join(", ") ||
    company.Address ||
    "India";
  const description =
    basic.CompanyDescription ||
    basic.AboutCompany ||
    basic.Description ||
    company.CompanyDescription ||
    company.Description;
  const businessType = basic.CompanyTypeName || company.UserTypeName;
  const status = company.Status || "Verified company";
  const imageUri = companyImageUrl(userId);

  const activeServices = useMemo(
    () =>
      services
        .filter((s) => Number(s?.IsActive ?? s?.isActive) === 1)
        .map((s) => ({
          id:
            Number(
              s?.ServiceID ?? s?.serviceID ?? s?.ServiceId ?? s?.serviceId,
            ) || 0,
          name: s?.ServiceName || s?.serviceName || s?.Name || s?.name || "",
        }))
        .filter((s) => s.name),
    [services],
  );

  const registrationRows = [
    { label: "GST number", value: basic.GSTNo || company.GSTNo },
    { label: "CIN number", value: basic.CINNo || company.CINNo },
    {
      label: "MSME / Udyam",
      value: basic.UdyogRegistrationNo || company.UdyogRegistrationNo,
    },
  ].filter((r) => r.value);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const jumpTo = (id) => {
    const y = sectionY.current[id];
    if (y != null)
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 56), animated: true });
  };

  // Opens a service in the drawer screen, which re-targets the category sidebar.
  const openService = (s) => {
    if (!s.id) return;
    navigation.navigate("Main", {
      screen: "CompanySubServices",
      params: { serviceId: s.id, serviceName: s.name },
    });
  };

  const onSectionLayout = (id, y) => {
    sectionY.current[id] = y;
  };

  const tileWidthStyle = twoCol ? undefined : { width: "100%" };

  return (
    <Screen>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />

      <ScreenHeader
        title={companyName}
        subtitle="Company profile"
        icon="business"
        showBack
        onBack={handleBack}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh company profile"
            onPress={() => detailQuery.refetch()}
            disabled={detailQuery.isFetching}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.ink} />
          </Pressable>
        }
      />

      {detailQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading company profile…</Text>
        </View>
      ) : detailQuery.isError || (detailQuery.isSuccess && !hasProfile) ? (
        <View style={styles.center}>
          <View style={styles.stateIcon}>
            <Ionicons
              name="alert-circle-outline"
              size={26}
              color={COLORS.faint}
            />
          </View>
          <Text style={styles.stateTitle}>
            Company details could not be loaded.
          </Text>
          <Pressable onPress={() => detailQuery.refetch()} style={styles.retry}>
            <Ionicons name="reload-outline" size={14} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={detailQuery.isFetching && !detailQuery.isLoading}
              onRefresh={() => detailQuery.refetch()}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroImageWrap}>
              {imageUri && !imgFailed ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.heroImg}
                  resizeMode="cover"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <View style={styles.heroFallback}>
                  <Ionicons
                    name="business-outline"
                    size={56}
                    color="rgba(255,255,255,0.8)"
                  />
                  <Text style={styles.heroFallbackText}>Company profile</Text>
                </View>
              )}
              <View style={styles.heroShade} />
              <View style={styles.photoTag}>
                <Ionicons name="image-outline" size={12} color="#fff" />
                <Text style={styles.photoTagText}>Company profile photo</Text>
              </View>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.chipRow}>
                <View style={styles.verifiedChip}>
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color={COLORS.green}
                  />
                  <Text style={styles.verifiedText}>{status}</Text>
                </View>
                {!!businessType && (
                  <View style={styles.typeChip}>
                    <Text style={styles.typeText}>{businessType}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroTitle}>{companyName}</Text>
              <View style={styles.locRow}>
                <Ionicons name="location" size={15} color={COLORS.primary} />
                <Text style={styles.locText}>{location}</Text>
              </View>
            </View>

            {/* Section tabs */}
            <View style={styles.tabs}>
              {SECTIONS.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => jumpTo(s.id)}
                  style={styles.tab}
                >
                  <Text style={styles.tabText}>{s.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* About */}
          <Section
            id="overview"
            icon="business-outline"
            title={`About ${companyName}`}
            onLayout={onSectionLayout}
          >
            <Text style={styles.body}>
              {description ||
                `${companyName} is listed on Contracts India${
                  location ? `, serving customers from ${location}` : ""
                }. Explore the company's listed services and verified business information on this profile.`}
            </Text>
            <View style={styles.grid}>
              <InfoTile
                label="Business name"
                value={companyName}
                fullWidth={!twoCol}
              />
              <InfoTile label="Location" value={location} fullWidth={!twoCol} />
              <InfoTile
                label="Business type"
                value={businessType}
                fullWidth={!twoCol}
              />
              <InfoTile
                label="Profile status"
                value={company.Status || "Listed on Contracts India"}
                fullWidth={!twoCol}
              />
            </View>
          </Section>

          {/* Services */}
          <Section
            id="services"
            icon="briefcase-outline"
            title="Services offered"
            onLayout={onSectionLayout}
          >
            {activeServices.length ? (
              activeServices.map((s, index) => {
                const tappable = s.id > 0;
                return (
                  <Pressable
                    key={`${s.id}-${s.name}-${index}`}
                    onPress={() => tappable && openService(s)}
                    disabled={!tappable}
                    accessibilityRole={tappable ? "button" : "text"}
                    style={({ pressed }) => [
                      styles.serviceRow,
                      tappable
                        ? styles.serviceRowActive
                        : styles.serviceRowPlain,
                      pressed &&
                        tappable && {
                          opacity: 0.85,
                          transform: [{ scale: 0.98 }],
                        },
                    ]}
                  >
                    <View
                      style={[
                        styles.serviceIcon,
                        !tappable && { backgroundColor: COLORS.slateLight },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={tappable ? COLORS.primary : COLORS.faint}
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.serviceName} numberOfLines={2}>
                        {s.name}
                      </Text>
                      {tappable && (
                        <Text style={styles.serviceSub}>
                          Explore contractors
                        </Text>
                      )}
                    </View>
                    {tappable && (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={COLORS.faint}
                      />
                    )}
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.body}>
                No services have been added to this profile yet.
              </Text>
            )}
          </Section>

          {/* Business details */}
          <Section
            id="business"
            icon="document-text-outline"
            title="Business details"
            onLayout={onSectionLayout}
          >
            {registrationRows.length ? (
              <View style={styles.grid}>
                {registrationRows.map((r) => (
                  <InfoTile
                    key={r.label}
                    label={r.label}
                    value={r.value}
                    fullWidth={!twoCol}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.body}>
                Registration information has not been provided.
              </Text>
            )}
            <View style={styles.note}>
              <Ionicons
                name="shield-checkmark-outline"
                size={15}
                color={COLORS.green}
              />
              <Text style={styles.noteText}>
                Contact and registration information is displayed only when
                supplied in the company profile.
              </Text>
            </View>
          </Section>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingBottom: 32 },
  center: {
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
  stateText: { color: COLORS.muted, fontSize: 12 },
  stateTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
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

  /* Hero */
  hero: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  heroImageWrap: {
    height: 200,
    backgroundColor: COLORS.heroDark,
    overflow: "hidden",
  },
  heroImg: { width: "100%", height: "100%" },
  heroFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heroFallbackText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "700",
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.25)",
  },
  photoTag: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  photoTagText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  heroBody: { padding: 16, gap: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.greenLight,
  },
  verifiedText: { color: COLORS.green, fontSize: 11, fontWeight: "800" },
  typeChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.indigoLight,
  },
  typeText: { color: COLORS.primary, fontSize: 11, fontWeight: "800" },
  heroTitle: { color: COLORS.ink, fontSize: 22, fontWeight: "900" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locText: { flex: 1, color: COLORS.muted, fontSize: 13 },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { color: COLORS.muted, fontSize: 12, fontWeight: "800" },

  /* Sections */
  section: {
    marginTop: 12,
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    gap: 12,
  },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { color: COLORS.ink, fontSize: 16, fontWeight: "900" },
  body: { color: COLORS.slate, fontSize: 13, lineHeight: 21 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "48%",
    flexGrow: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  tileLabel: {
    color: COLORS.faint,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tileValue: {
    color: COLORS.slate,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },

  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  serviceRowActive: {
    borderColor: COLORS.indigoLine,
    backgroundColor: "#FAFAFF",
  },
  serviceRowPlain: { borderColor: COLORS.line, backgroundColor: COLORS.canvas },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.indigoLight,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: { color: COLORS.slate, fontSize: 14, fontWeight: "800" },
  serviceSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },

  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.canvas,
  },
  noteText: { flex: 1, color: COLORS.muted, fontSize: 11, lineHeight: 16 },
});
