import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "@/components";
import { Routes } from "@/constants/routes";
import { colors } from "@/constants/colors";
import { radius, spacing, typography } from "@/constants/sizes";
import { buildTree, fetchMenu, getAncestorIds } from "@/utils/serviceData";
import {
  companyImageUrl,
  fetchVerifiedCompanies,
  toCompanyCard,
} from "@/services/companyService";
import { useCategoryStore } from "@/store/categoryStore";
import { openAuthentication } from "@/utils/authAccess";

const TRADE_ICONS = [
  [/electr|power|solar|wire/i, "lightning-bolt-outline"],
  [/arch|interior|design/i, "floor-plan"],
  [/civil|construct|build|infra|epc/i, "crane"],
  [/plumb|water|sanitar/i, "pipe-wrench"],
  [/hvac|air|cool/i, "air-conditioner"],
  [/fire/i, "fire-alert"],
  [/legal|law|tender|audit|account/i, "scale-balance"],
  [/material|steel|cement|supply/i, "cube-outline"],
  [/market|brand|advert/i, "bullhorn-outline"],
];

const iconForService = (name = "") =>
  TRADE_ICONS.find(([pattern]) => pattern.test(name))?.[1] ??
  "briefcase-outline";

const SERVICE_TONES = [
  { bg: "#EDF4FA", icon: colors.primary },
  { bg: "#EAF5F2", icon: "#11765A" },
  { bg: "#FBF2E6", icon: "#A35C12" },
  { bg: "#F2EDFA", icon: "#6F4AA5" },
];

function SearchEntry({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel="Search service categories"
      style={({ pressed }) => [styles.search, pressed && styles.pressed]}
    >
      <Ionicons name="search-outline" size={19} color={colors.textMuted} />
      <Text style={styles.searchLabel}>Search services and expertise</Text>
      <View style={styles.searchAction}>
        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
      </View>
    </Pressable>
  );
}

function ServiceCard({ service, index, onPress }) {
  const tone = SERVICE_TONES[index % SERVICE_TONES.length];
  const childrenCount = service.children?.length ?? 0;
  const description =
    service.ServiceDescription || service.serviceDescription || "";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Explore ${service.ServiceName}`}
      style={({ pressed }) => [
        styles.serviceCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.serviceIcon, { backgroundColor: tone.bg }]}>
        <MaterialCommunityIcons
          name={iconForService(service.ServiceName)}
          size={21}
          color={tone.icon}
        />
      </View>
      <Text style={styles.serviceName} numberOfLines={2}>
        {service.ServiceName}
      </Text>
      {description ? (
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {description}
        </Text>
      ) : (
        <Text style={styles.serviceDescription} numberOfLines={1}>
          {childrenCount
            ? `${childrenCount} service options`
            : "Explore this service"}
        </Text>
      )}
      <View style={styles.cardLink}>
        <Text style={styles.cardLinkText}>Explore</Text>
        <MaterialCommunityIcons
          name="arrow-right"
          size={15}
          color={colors.primary}
        />
      </View>
    </Pressable>
  );
}

function CompanyCard({ company, onPress }) {
  const image = companyImageUrl(company.userId);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${company.name}`}
      style={({ pressed }) => [styles.companyCard, pressed && styles.pressed]}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={styles.companyImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.companyFallback}>
          <MaterialCommunityIcons
            name="domain"
            size={24}
            color={colors.primary}
          />
        </View>
      )}
      <View style={styles.companyCopy}>
        <Text style={styles.companyName} numberOfLines={1}>
          {company.name || "Verified company"}
        </Text>
        {!!company.type && (
          <Text style={styles.companyType} numberOfLines={1}>
            {company.type}
          </Text>
        )}
        {!!company.loc && (
          <View style={styles.companyLocation}>
            <Ionicons
              name="location-outline"
              size={13}
              color={colors.textMuted}
            />
            <Text style={styles.companyLocationText} numberOfLines={1}>
              {company.loc}
            </Text>
          </View>
        )}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

export default function GuestLandingScreen() {
  const navigation = useNavigation();
  const selectCategory = useCategoryStore((state) => state.select);
  const menuQuery = useQuery({
    queryKey: ["ServiceMenuGetList"],
    queryFn: fetchMenu,
    staleTime: 5 * 60 * 1000,
  });
  const serviceTree = useMemo(
    () => buildTree(menuQuery.data ?? []),
    [menuQuery.data],
  );
  const companiesQuery = useQuery({
    queryKey: [
      "userRegistrationDetailsGetApi",
      { isVerifiedByAdmin: 1, userType: 2 },
    ],
    queryFn: fetchVerifiedCompanies,
    select: (rows) => rows.map(toCompanyCard),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const openService = (service) => {
    const id = service.ServiceID;
    selectCategory(id, [...getAncestorIds(serviceTree, id)]);
    navigation.navigate(Routes.CompanySubServices, {
      serviceId: id,
      serviceName: service.ServiceName,
    });
  };
  const openCompanies = () => navigation.navigate(Routes.GuestCompanies);
  const openCategories = () =>
    navigation.navigate(Routes.GuestCategories);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandLockup}>
            <Image
              source={require("@/assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <View>
              <Text style={styles.brandName}>ContractsIndia</Text>
              <View style={styles.location}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={colors.textMuted}
                />
                <Text style={styles.locationText}>Construction marketplace</Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => openAuthentication(navigation)}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.loginButtonText}>Sign in</Text>
          </Pressable>
        </View>

        <SearchEntry onPress={openCategories} />

        <View style={styles.hero}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroContent}>
            <View style={styles.heroEyebrow}>
              <MaterialCommunityIcons
                name="domain"
                size={14}
                color="#E3C58C"
              />
              <Text style={styles.heroEyebrowText}>BUILD WITH CONFIDENCE</Text>
            </View>
            <Text style={styles.heroTitle}>
              Find the right expertise for your next project.
            </Text>
            <Text style={styles.heroBody}>
              Explore construction services and verified businesses, all in one
              marketplace.
            </Text>
            <Pressable
              onPress={openCategories}
              accessibilityRole="button"
              accessibilityLabel="Explore services"
              style={({ pressed }) => [
                styles.heroButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.heroButtonText}>Explore services</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={17}
                color={colors.primaryDark}
              />
            </Pressable>
          </View>
          <View pointerEvents="none" style={styles.heroMark}>
            <MaterialCommunityIcons
              name="office-building-outline"
              size={92}
              color="rgba(255,255,255,0.12)"
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>Explore services</Text>
            <Text style={styles.sectionSubtitle}>
              Browse real categories from our service catalog.
            </Text>
          </View>
          <Pressable
            onPress={openCategories}
            accessibilityRole="button"
            accessibilityLabel="View all services"
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>All</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={15}
              color={colors.primary}
            />
          </Pressable>
        </View>

        {menuQuery.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading service categories…</Text>
          </View>
        ) : menuQuery.isError ? (
          <Pressable
            onPress={() => menuQuery.refetch()}
            style={styles.stateCard}
            accessibilityRole="button"
            accessibilityLabel="Retry loading services"
          >
            <MaterialCommunityIcons
              name="cloud-refresh-outline"
              size={22}
              color={colors.primary}
            />
            <Text style={styles.stateText}>Services couldn’t be loaded.</Text>
            <Text style={styles.seeAllText}>Tap to retry</Text>
          </Pressable>
        ) : serviceTree.length === 0 ? (
          <View style={styles.stateCard}>
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={22}
              color={colors.textMuted}
            />
            <Text style={styles.stateText}>No services are available yet.</Text>
          </View>
        ) : (
          <View style={styles.serviceGrid}>
            {serviceTree.slice(0, 6).map((service, index) => (
              <ServiceCard
                key={String(service.ServiceID)}
                service={service}
                index={index}
                onPress={() => openService(service)}
              />
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>Verified businesses</Text>
            <Text style={styles.sectionSubtitle}>
              Discover companies approved for the marketplace.
            </Text>
          </View>
          <Pressable
            onPress={openCompanies}
            accessibilityRole="button"
            accessibilityLabel="View verified companies"
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>All</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={15}
              color={colors.primary}
            />
          </Pressable>
        </View>

        {companiesQuery.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading verified businesses…</Text>
          </View>
        ) : companiesQuery.isError ? (
          <View style={styles.stateCard}>
            <MaterialCommunityIcons
              name="cloud-off-outline"
              size={22}
              color={colors.textMuted}
            />
            <Text style={styles.stateText}>
              Verified businesses couldn’t be loaded.
            </Text>
          </View>
        ) : companiesQuery.data?.length ? (
          <View style={styles.companyList}>
            {companiesQuery.data.slice(0, 3).map((company, index) => (
              <CompanyCard
                key={String(company.userId || index)}
                company={company}
                onPress={() =>
                  navigation.navigate(Routes.CompanyDetailScreen, {
                    userId: company.userId,
                    name: company.name,
                  })
                }
              />
            ))}
          </View>
        ) : (
          <View style={styles.stateCard}>
            <MaterialCommunityIcons
              name="domain"
              size={22}
              color={colors.textMuted}
            />
            <Text style={styles.stateText}>
              No verified businesses are available yet.
            </Text>
          </View>
        )}

        <View style={styles.signInBanner}>
          <View style={styles.signInIcon}>
            <MaterialCommunityIcons
              name="account-arrow-right-outline"
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.signInCopy}>
            <Text style={styles.signInTitle}>Ready to get started?</Text>
            <Text style={styles.signInBody}>
              Sign in to manage your account and access member services.
            </Text>
          </View>
          <Pressable
            onPress={() => openAuthentication(navigation)}
            style={({ pressed }) => [
              styles.signInAction,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign in to your account"
          >
            <MaterialCommunityIcons
              name="arrow-right"
              size={18}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  pressed: { opacity: 0.82 },
  header: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  brandLockup: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logo: { width: 42, height: 42, borderRadius: radius.md },
  brandName: { ...typography.bodyBold, color: colors.primary, fontSize: 16 },
  location: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  locationText: { color: colors.textMuted, fontSize: 10, fontWeight: "600" },
  loginButton: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  loginButtonText: { ...typography.label, color: colors.primary },
  search: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  searchLabel: { flex: 1, color: colors.textMuted, fontSize: 13 },
  searchAction: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    minHeight: 256,
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
  },
  heroContent: {
    zIndex: 1,
    maxWidth: 500,
    padding: spacing.xl,
  },
  heroEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroEyebrowText: {
    color: "#E7DABF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    maxWidth: 340,
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    letterSpacing: -0.5,
    marginTop: spacing.md,
  },
  heroBody: {
    maxWidth: 340,
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  heroButton: {
    minHeight: 46,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#FFFFFF",
  },
  heroButtonText: { ...typography.label, color: colors.primaryDark },
  heroMark: {
    position: "absolute",
    right: -14,
    bottom: 10,
    transform: [{ rotate: "-8deg" }],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { ...typography.h3, color: colors.text },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  seeAll: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.xs,
  },
  seeAllText: { ...typography.label, color: colors.primary },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.sm,
  },
  serviceCard: {
    width: "48.5%",
    minHeight: 176,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: {
    ...typography.bodyBold,
    color: colors.text,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  serviceDescription: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  cardLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.sm,
  },
  cardLinkText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  loading: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: { color: colors.textMuted, fontSize: 12 },
  stateCard: {
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  stateText: { color: colors.textMuted, fontSize: 12, textAlign: "center" },
  companyList: { gap: spacing.sm },
  companyCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  companyImage: { width: 54, height: 54, borderRadius: radius.md },
  companyFallback: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  companyCopy: { flex: 1, minWidth: 0 },
  companyName: { ...typography.bodyBold, color: colors.text },
  companyType: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  companyLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  companyLocationText: { color: colors.textMuted, fontSize: 10 },
  signInBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  signInIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  signInCopy: { flex: 1, minWidth: 0 },
  signInTitle: { ...typography.label, color: colors.text },
  signInBody: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  signInAction: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
});
