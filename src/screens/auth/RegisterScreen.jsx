import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getCities,
  getState,
  saveUserRegistration,
  ServiceRootGet,
  userType as fetchUserTypes,
} from "@/api/api";
import { Button } from "@/components";
import { Routes } from "@/constants/routes";
import { colors } from "@/constants/colors";
import { radius, spacing, typography } from "@/constants/sizes";

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const FALLBACK_USER_TYPES = [
  { value: "1", label: "Individual" },
  { value: "2", label: "Commercial" },
];

const EMPTY_FORM = {
  userType: "1",
  fullName: "",
  email: "",
  phone: "",
  businessName: "",
  state: "",
  city: "",
  serviceGroup: "",
  captcha: "",
};

const CAPTCHA_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const createCaptcha = () => {
  let text = "";
  for (let i = 0; i < 5; i += 1) {
    text += CAPTCHA_LETTERS[Math.floor(Math.random() * CAPTCHA_LETTERS.length)];
  }
  return { question: text, answer: text };
};

/** Normalises the different list shapes the API can return into { value, label }. */
const toOptions = (response) => {
  const source =
    [response?.data?.table, response?.data, response?.value, response].find(
      Array.isArray,
    ) ?? [];

  return source
    .map((item) => {
      if (item && typeof item === "object") {
        const value = String(item.value ?? item.id ?? item.ID ?? "");
        const label = String(
          item.label ?? item.name ?? item.Name ?? item.value ?? "",
        );
        return { value, label };
      }
      return { value: String(item), label: String(item) };
    })
    .filter((option) => option.value && option.label);
};

const isCommercialType = (value) => Number(value) === 2;

const validateForm = (form, isCommercial, captcha) => {
  const errors = {};
  const email = form.email.trim();
  const phone = form.phone.trim();

  if (!form.fullName.trim()) errors.fullName = "Required";

  if (!email) errors.email = "Required";
  else if (!/^\S+@\S+$/i.test(email)) errors.email = "Invalid email";

  if (!phone) errors.phone = "Required";
  else if (!/^[0-9+\-\s]{10,16}$/.test(phone)) errors.phone = "Invalid phone";

  if (!form.state) errors.state = "Required";
  if (!form.city) errors.city = "Required";

  if (isCommercial) {
    if (!form.businessName.trim()) errors.businessName = "Required";
    if (!form.serviceGroup) errors.serviceGroup = "Required";
  }

  if (!form.captcha.trim()) errors.captcha = "Required";
  else if (form.captcha.trim().toUpperCase() !== captcha.answer) {
    errors.captcha = "Incorrect captcha answer";
  }

  return errors;
};

/* -------------------------------------------------------------------------- */
/*                                  SCREEN                                    */
/* -------------------------------------------------------------------------- */

export default function RegisterScreen() {
  const navigation = useNavigation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [captcha, setCaptcha] = useState(createCaptcha);

  const isCommercial = isCommercialType(form.userType);

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  /* ----------------------------- Queries ------------------------------- */

  const statesQuery = useQuery({
    queryKey: ["registration", "states"],
    queryFn: async () => toOptions(await getState()),
    staleTime: Infinity,
  });

  const servicesQuery = useQuery({
    queryKey: ["registration", "root-services"],
    queryFn: async () => toOptions(await ServiceRootGet()),
    staleTime: Infinity,
    retry: false,
  });

  const userTypesQuery = useQuery({
    queryKey: ["registration", "user-types"],
    queryFn: async () => toOptions(await fetchUserTypes()),
    staleTime: Infinity,
    retry: false,
  });

  const citiesQuery = useQuery({
    queryKey: ["registration", "cities", form.state],
    queryFn: async () => toOptions(await getCities(Number(form.state))),
    enabled: !!form.state,
    staleTime: Infinity,
    retry: false,
  });

  const states = statesQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const cities = citiesQuery.data ?? [];
  const roleOptions = userTypesQuery.data?.length
    ? userTypesQuery.data
    : FALLBACK_USER_TYPES;

  /* ----------------------------- Mutation ------------------------------ */

  const registration = useMutation({
    mutationFn: saveUserRegistration,
    onSuccess: (response) => {
      if (!response?.status) {
        Alert.alert(
          "Registration failed",
          response?.message || "Please check your details and try again.",
        );
        refreshCaptcha();
        return;
      }

      navigation.navigate(Routes.OTP, {
        singleVerification: false,
        email: form.email.trim(),
        phone: form.phone.trim(),
        userType: Number(form.userType),
        selectedServiceGroup: form.serviceGroup,
        guId: response?.value || null,
      });
    },
    onError: (error) => {
      Alert.alert(
        "Unable to register",
        error?.message || "Please try again.",
      );
      refreshCaptcha();
    },
  });

  /* ----------------------------- Handlers ------------------------------ */

  const errors = submitted ? validateForm(form, isCommercial, captcha) : {};

  const selectRole = (value) => {
    setForm((current) => ({
      ...current,
      userType: String(value),
      ...(isCommercialType(value) ? {} : { businessName: "", serviceGroup: "" }),
    }));
  };

  const selectState = (value) => {
    setForm((current) => ({ ...current, state: value, city: "" }));
  };

  const refreshCaptcha = () => {
    setCaptcha(createCaptcha());
    setForm((current) => ({ ...current, captcha: "" }));
    setSubmitted(false);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const validationErrors = validateForm(form, isCommercial, captcha);
    if (Object.keys(validationErrors).length > 0) return;

    const stateObj = states.find((item) => item.value === form.state);
    const cityObj = cities.find((item) => item.value === form.city);
    const serviceObj = services.find((item) => item.value === form.serviceGroup);

    registration.mutate({
      name: form.fullName.trim(),
      emailId: form.email.trim(),
      mobileNo: form.phone.trim(),
      stateId: Number(stateObj?.value) || 0,
      stateName: stateObj?.label ?? "",
      cityName: cityObj?.label ?? "",
      userType: Number(form.userType),
      companyName: isCommercial ? form.businessName.trim() : "",
      serviceId: isCommercial ? Number(form.serviceGroup) || 0 : 0,
      serviceName: isCommercial ? serviceObj?.label ?? "" : "",
    });
  };

  /* ------------------------------ Render ------------------------------- */

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.topTitle}>Sign up</Text>
          <View style={styles.backSpacer} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroGlow} pointerEvents="none" />
          <View style={styles.heroBadge}>
            <Ionicons name="people-outline" size={13} color="#FFFFFF" />
            <Text style={styles.heroBadgeText}>
              Trusted by 30,000+ users 
            </Text>
          </View>
          <Text style={styles.heroTitle}>Join Contracts India</Text>
          <Text style={styles.heroSubtitle}>
            Find trusted contractors, or grow your business across India.
          </Text>
        </View>

        {/* Account type */}
        <Text style={styles.sectionLabel}>I am registering as</Text>
        <View style={styles.roleRow}>
          {roleOptions.map((option) => {
            const active = Number(form.userType) === Number(option.value);
            const commercial = isCommercialType(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => selectRole(option.value)}
                style={({ pressed }) => [
                  styles.roleCard,
                  active && styles.roleCardActive,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.label}
              >
                <View style={styles.roleTop}>
                  <View
                    style={[
                      styles.roleIcon,
                      { backgroundColor: commercial ? "#ECFEFF" : "#EEF2FF" },
                    ]}
                  >
                    <Ionicons
                      name={commercial ? "business-outline" : "person-outline"}
                      size={19}
                      color={commercial ? "#0E7490" : "#4F46E5"}
                    />
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : null}
                  </View>
                </View>
                <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>
                  {option.label}
                </Text>
                <Text style={styles.roleDesc}>
                  {commercial
                    ? "contractor or supplier"
                    : "builder or buyer"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          {isCommercial ? (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Business details</Text>
                <View style={styles.dividerLine} />
              </View>

              <TextField
                label="Business name"
                icon="business-outline"
                placeholder="Company / firm name"
                value={form.businessName}
                onChangeText={(value) => update("businessName", value)}
                error={errors.businessName}
              />

              <SelectField
                label="Service category"
                icon="briefcase-outline"
                placeholder={servicesQuery.isLoading ? "Loading…" : "Select category"}
                options={services}
                value={form.serviceGroup}
                onSelect={(value) => update("serviceGroup", value)}
                disabled={servicesQuery.isLoading || services.length === 0}
                error={errors.serviceGroup}
                searchable={services.length > 8}
              />
            </>
          ) : null}

          <TextField
            label={isCommercial ? "Contact person name" : "Full name"}
            icon="person-outline"
            placeholder={isCommercial ? "Contact person name" : "Anjali Rao"}
            value={form.fullName}
            onChangeText={(value) => update("fullName", value)}
            autoCapitalize="words"
            error={errors.fullName}
          />

          <TextField
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            value={form.email}
            onChangeText={(value) => update("email", value)}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            error={errors.email}
          />

          <TextField
            label="Phone"
            icon="call-outline"
            placeholder="98xxxxxxxx"
            value={form.phone}
            onChangeText={(value) => update("phone", value)}
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <SelectField
            label="State"
            icon="map-outline"
            placeholder={statesQuery.isLoading ? "Loading states…" : "Select state"}
            options={states}
            value={form.state}
            onSelect={selectState}
            disabled={statesQuery.isLoading || states.length === 0}
            error={errors.state}
            searchable
          />

          <SelectField
            label="City"
            icon="location-outline"
            placeholder={
              !form.state
                ? "Select state first"
                : citiesQuery.isLoading
                  ? "Loading cities…"
                  : "Select city"
            }
            options={cities}
            value={form.city}
            onSelect={(value) => update("city", value)}
            disabled={!form.state || citiesQuery.isLoading || cities.length === 0}
            error={errors.city}
            searchable
          />

          {/* Captcha */}
          <View style={styles.field}>
            <Text style={styles.label}>Security check</Text>
            <View style={styles.captchaRow}>
              <View style={styles.captchaCode}>
                {captcha.question.split("").map((char, index) => (
                  <Text key={`${char}-${index}`} style={styles.captchaChar}>
                    {char}
                  </Text>
                ))}
              </View>
              <Pressable
                onPress={refreshCaptcha}
                style={({ pressed }) => [
                  styles.captchaRefresh,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Refresh security code"
              >
                <Ionicons name="refresh" size={18} color={colors.primary} />
              </Pressable>
            </View>
            <TextField
              label="Type the code above"
              icon="shield-checkmark-outline"
              placeholder="Enter code"
              value={form.captcha}
              onChangeText={(value) => update("captcha", value.toUpperCase())}
              autoCapitalize="characters"
              maxLength={5}
              error={errors.captcha}
            />
          </View>

          <Button
            title="Create account"
            onPress={handleSubmit}
            loading={registration.isPending}
            disabled={registration.isPending || statesQuery.isLoading}
            fullWidth
            icon={<Ionicons name="arrow-forward" size={17} color="#FFFFFF" />}
          />
        </View>

        {/* Next step hint */}
        <View style={styles.hint}>
          <View style={styles.hintIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color={colors.primary}
            />
          </View>
          <Text style={styles.hintText}>
            We'll send a one-time code to verify your email and mobile.
            {isCommercial
              ? " Your business profile can be completed after verification."
              : ""}
          </Text>
        </View>

        <Text style={styles.terms}>
          By signing up you agree to our Terms and Privacy Policy.
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable
            onPress={() => navigation.navigate(Routes.Login)}
            hitSlop={8}
            accessibilityRole="link"
          >
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* -------------------------------------------------------------------------- */
/*                               FORM CONTROLS                                */
/* -------------------------------------------------------------------------- */

function TextField({ label, icon, error, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, !!error && styles.inputBoxError]}>
        {icon ? (
          <Ionicons name={icon} size={17} color={colors.textMuted} />
        ) : null}
        <TextInput
          style={styles.input}
          placeholderTextColor="#94A3B8"
          {...inputProps}
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function SelectField({
  label,
  icon,
  placeholder,
  options,
  value,
  onSelect,
  disabled,
  error,
  searchable,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
  }, [options, query]);

  const openSheet = () => {
    setQuery("");
    setOpen(true);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={openSheet}
        disabled={disabled}
        style={({ pressed }) => [
          styles.inputBox,
          !!error && styles.inputBoxError,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
      >
        <Ionicons name={icon} size={17} color={colors.textMuted} />
        <Text
          style={[styles.selectText, !selected && styles.selectPlaceholder]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>

            {searchable ? (
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="#94A3B8"
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                />
              </View>
            ) : null}

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              style={styles.optionList}
              ListEmptyComponent={
                <Text style={styles.sheetEmpty}>No matches found</Text>
              }
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onSelect(item.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      active && styles.optionActive,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[styles.optionText, active && styles.optionTextActive]}
                    >
                      {item.label}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  STYLES                                    */
/* -------------------------------------------------------------------------- */

const SHADOW = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 3,
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...SHADOW,
    shadowOpacity: 0.05,
  },
  backSpacer: { width: 42 },
  topTitle: { ...typography.label, color: colors.text, fontWeight: "700" },

  /* Hero */
  hero: {
    padding: spacing.lg,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: spacing.lg,
    ...SHADOW,
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  heroGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -60,
    right: -50,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: spacing.md,
  },
  heroBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 19,
  },

  /* Account type */
  sectionLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  roleRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  roleCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: "rgba(15, 23, 42, 0.08)",
    ...SHADOW,
    shadowOpacity: 0.04,
    elevation: 1,
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: "#F5F8FD" },
  roleTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  roleTitle: { ...typography.bodyBold, color: colors.text },
  roleTitleActive: { color: colors.primary },
  roleDesc: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },

  /* Form card */
  formCard: {
    padding: spacing.lg,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 23, 42, 0.06)",
    ...SHADOW,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  /* Fields */
  field: { marginBottom: spacing.md },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputBox: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
  },
  inputBoxError: { borderColor: colors.danger, backgroundColor: "#FEF2F2" },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 12,
  },
  selectText: { flex: 1, color: colors.text, fontSize: 14 },
  selectPlaceholder: { color: "#94A3B8" },
  fieldError: {
    marginTop: 5,
    color: colors.danger,
    fontSize: 11,
    fontWeight: "600",
  },
  disabled: { opacity: 0.5 },

  /* Captcha */
  captchaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  captchaCode: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    backgroundColor: "#EEF4FB",
    borderWidth: 1,
    borderColor: "#D6E4EE",
  },
  captchaChar: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 2,
  },
  captchaRefresh: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FB",
    borderWidth: 1,
    borderColor: "#D6E4EE",
  },

  /* Select sheet */
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  sheet: {
    maxHeight: "75%",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 11 },
  optionList: { flexGrow: 0 },
  option: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  optionActive: { backgroundColor: "#EEF4FB" },
  optionText: { color: colors.text, fontSize: 14 },
  optionTextActive: { color: colors.primary, fontWeight: "700" },
  sheetEmpty: {
    paddingVertical: spacing.lg,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },

  /* Hint and footer */
  hint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: "#EEF4FB",
  },
  hintIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  hintText: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  terms: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
    lineHeight: 17,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
    gap: 4,
  },
  footerText: { ...typography.body, color: colors.textMuted },
  footerLink: {
    ...typography.label,
    color: colors.primary,
    fontWeight: "700",
    paddingVertical: 4,
  },

  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});