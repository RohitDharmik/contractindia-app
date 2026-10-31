import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DocumentCategoryGet,
  DocumentSubCategoryGet,
  getUserServicesByParam,
  userBankDetailbyParams,
  UserDocumentStoreDelete,
  UserDocumentStoreGetById,
  UserDocumentStoreSave,
  UserDocumentStoreUpdate,
  UserRegistrationUserIdGet,
  UserServiceDetailsSave,
  UserServiceDetailsUpdate,
  UserSubscriptionDetailGet,
  userBankDetailSave,
  userBasicInformationbyParam,
  userBasicInformationSave,
  userCommonlistType,
} from "@/api/api";
import { Button, Input, Screen, ScreenHeader } from "@/components";
import { API_BASE_URL } from "@/constants/config";
import { Routes } from "@/constants/routes";
import { colors } from "@/constants/colors";
import { spacing, typography } from "@/constants/sizes";
import { useAuthStore } from "@/store/authStore";

const STEPS = [
  { title: "Business type", icon: "business-outline" },
  { title: "Basic info", icon: "person-outline" },
  { title: "Registration", icon: "document-text-outline" },
  { title: "Documents", icon: "folder-open-outline" },
  { title: "Services", icon: "briefcase-outline" },
  { title: "Banking", icon: "card-outline" },
];

const EMPTY_BASIC = {
  companyName: "",
  contactPerson: "",
  email: "",
  mobile: "",
  address: "",
  pinCode: "",
  locationName: "",
  district: "",
  state: "",
  country: "",
};

const EMPTY_REGISTRATION = {
  gstNo: "",
  panNo: "",
  cinNo: "",
  aadharNo: "",
  pfNo: "",
  esiNo: "",
  msmeNo: "",
  udyogAadhaarToggle: false,
  licenseNo: "",
  licenseExpiryDate: "",
};

const EMPTY_BANK = {
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  micrCode: "",
};

const unwrapList = (response) => {
  let value = response?.data ?? response ?? [];
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      throw new Error("The server returned data in an unsupported format.");
    }
  }
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return [value];
  return [];
};

const firstValue = (source, ...keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return "";
};

const isSuccessful = (response) => {
  const payload = Array.isArray(response)
    ? response[0]
    : Array.isArray(response?.data)
      ? response.data[0]
      : response?.data ?? response;
  const payloadStatus = firstValue(payload, "status", "Status");
  if (payloadStatus !== "") {
    if (typeof payloadStatus === "number") {
      return payloadStatus >= 200 && payloadStatus < 300;
    }
    return [true, 1, "1", "success"].includes(
      typeof payloadStatus === "string"
        ? payloadStatus.toLowerCase()
        : payloadStatus,
    );
  }
  if (typeof payload?.success === "boolean") return payload.success;
  if (payload?.error || payload?.errors) return false;
  return true;
};

const ensureSuccess = (response, fallback) => {
  if (!isSuccessful(response)) {
    throw new Error(response?.message || fallback);
  }
};

const serviceIdOf = (item) =>
  String(firstValue(item, "ServiceID", "serviceID", "serviceId", "id"));

const buildServiceTree = (items) => {
  const nodes = new Map();
  items.forEach((item) => {
    const id = serviceIdOf(item);
    if (id) nodes.set(id, { id, item, parent: null, children: [] });
  });

  nodes.forEach((node) => {
    const parentId = String(
      firstValue(node.item, "ParentServiceID", "parentServiceID", "parentServiceId") || "",
    );
    const parent = nodes.get(parentId);
    if (!parent || parent === node) return;

    let ancestor = parent;
    while (ancestor && ancestor !== node) ancestor = ancestor.parent;
    if (ancestor === node) return;

    node.parent = parent;
    parent.children.push(node);
  });

  return Array.from(nodes.values()).filter((node) => !node.parent);
};

const fileToBase64 = async (uri) => {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Unable to read the selected document.");
  const blob = await response.blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to prepare the document."));
    reader.readAsDataURL(blob);
  });
  const encoded = String(dataUrl).split(",")[1];
  if (!encoded) throw new Error("Unable to prepare the document.");
  return { base64: encoded, size: blob.size };
};

const formatBytes = (size) => {
  if (!size) return "";
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(size / 1024)} KB`;
};

function StepIntro({ icon, title, detail }) {
  return (
    <View style={styles.stepIntro}>
      <View style={styles.stepIntroIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.stepIntroCopy}>
        <Text style={styles.stepIntroTitle}>{title}</Text>
        <Text style={styles.stepIntroDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={17} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InlineNotice({ icon = "information-circle-outline", children }) {
  return (
    <View style={styles.notice}>
      <Ionicons name={icon} size={17} color={colors.info} />
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export default function CompanyProfileWizardScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const profileGateUnlocked = useAuthStore(
    (state) => state.profileGateUnlocked,
  );
  const setProfileGateUnlocked = useAuthStore(
    (state) => state.setProfileGateUnlocked,
  );
  const userId = user?.userId;
  const isProfileGateActive =
    Number(user?.userType) === 2 && !profileGateUnlocked;
  const [step, setStep] = useState(0);
  const [companyType, setCompanyType] = useState("");
  const [companyTypeName, setCompanyTypeName] = useState("");
  const [basic, setBasic] = useState(EMPTY_BASIC);
  const [registration, setRegistration] = useState(EMPTY_REGISTRATION);
  const [bank, setBank] = useState(EMPTY_BANK);
  const [locations, setLocations] = useState([]);
  const [lookingUpPin, setLookingUpPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [serviceBusyId, setServiceBusyId] = useState("");
  const [expandedServiceIds, setExpandedServiceIds] = useState(() => new Set());
  const serviceBusyIdRef = useRef("");
  const serviceOrderRef = useRef(new Map());
  const serviceExpansionInitialized = useRef(false);

  const typesQuery = useQuery({
    queryKey: ["company-profile-types"],
    queryFn: () => userCommonlistType("Organisation_type"),
    select: unwrapList,
    retry: false,
  });
  const registrationQuery = useQuery({
    queryKey: ["company-profile-registration", userId],
    queryFn: () => UserRegistrationUserIdGet(userId),
    select: unwrapList,
    enabled: !!userId,
    retry: false,
  });
  const basicQuery = useQuery({
    queryKey: ["company-profile-basic", userId],
    queryFn: () => userBasicInformationbyParam(`userId=${userId}`),
    select: unwrapList,
    enabled: !!userId,
    retry: false,
  });
  const bankQuery = useQuery({
    queryKey: ["company-profile-bank", userId],
    queryFn: () => userBankDetailbyParams(`userId=${userId}`),
    select: unwrapList,
    enabled: !!userId,
    retry: false,
  });
  const categoriesQuery = useQuery({
    queryKey: ["company-profile-document-categories"],
    queryFn: DocumentCategoryGet,
    select: unwrapList,
    retry: false,
  });
  const subcategoriesQuery = useQuery({
    queryKey: ["company-profile-document-subcategories"],
    queryFn: DocumentSubCategoryGet,
    select: unwrapList,
    retry: false,
  });
  const documentsQuery = useQuery({
    queryKey: ["company-profile-documents", userId],
    queryFn: () => UserDocumentStoreGetById(`userId=${userId}`),
    select: unwrapList,
    enabled: !!userId,
    retry: false,
  });
  const servicesQuery = useQuery({
    queryKey: ["company-profile-services", userId],
    queryFn: () => getUserServicesByParam(`userId=${userId}`),
    select: unwrapList,
    enabled: !!userId,
    retry: false,
  });
  const subscriptionsQuery = useQuery({
    queryKey: ["company-profile-subscriptions", userId],
    queryFn: () => UserSubscriptionDetailGet(`userId=${userId}`),
    select: unwrapList,
    enabled: !!userId,
    retry: false,
  });
  const refetchServices = servicesQuery.refetch;
  const refetchSubscriptions = subscriptionsQuery.refetch;
  useFocusEffect(
    useCallback(() => {
      if (!userId) return undefined;
      refetchServices();
      refetchSubscriptions();
      return undefined;
    }, [refetchServices, refetchSubscriptions, userId]),
  );
  const registrationRecord = registrationQuery.data?.[0];
  const basicRecord = basicQuery.data?.[0];
  const bankRecord = bankQuery.data?.[0];

  useEffect(() => {
    if (!basicRecord && !registrationRecord) return;
    const profile = { ...registrationRecord, ...basicRecord };
    setCompanyType((current) =>
      current || String(firstValue(profile, "CompanyTypeId", "companyTypeId")),
    );
    setCompanyTypeName((current) =>
      current || String(firstValue(profile, "CompanyTypeName", "companyTypeName")),
    );
    setBasic((current) => ({
      companyName: current.companyName || String(firstValue(profile, "CompanyName", "companyName") || ""),
      contactPerson: current.contactPerson || String(firstValue(profile, "ContactPerson", "Name", "ContactNo") || ""),
      email: current.email || String(firstValue(profile, "Email", "EmailId", "email") || ""),
      mobile: current.mobile || String(firstValue(profile, "ContactNo", "MobileNo", "mobile") || ""),
      address: current.address || String(firstValue(profile, "Address", "address") || ""),
      pinCode:
        current.pinCode ||
        String(firstValue(profile, "PinCode", "pinCode") || ""),
      locationName: current.locationName || String(firstValue(profile, "LocationName", "locationName") || ""),
      district: current.district || String(firstValue(profile, "District", "district") || ""),
      state: current.state || String(firstValue(profile, "State", "state") || ""),
      country: current.country || String(firstValue(profile, "Country", "country") || ""),
    }));
    setRegistration((current) => ({
      gstNo: current.gstNo || String(firstValue(profile, "GSTNo", "gstNo") || ""),
      panNo: current.panNo || String(firstValue(profile, "PANNo", "panNo") || ""),
      cinNo: current.cinNo || String(firstValue(profile, "CINNo", "cinNo") || ""),
      aadharNo:
        current.aadharNo ||
        String(firstValue(profile, "AadharNo", "aadharNo") || ""),
      pfNo: current.pfNo || String(firstValue(profile, "PFNo", "pfNo") || ""),
      esiNo: current.esiNo || String(firstValue(profile, "ESINo", "esiNo") || ""),
      msmeNo: current.msmeNo || String(firstValue(profile, "UdyogRegistrationNo", "msmeNo") || ""),
      udyogAadhaarToggle:
        current.udyogAadhaarToggle ||
        [true, 1, "1"].includes(
          firstValue(profile, "IsMSME", "udyogAadhaarToggle"),
        ),
      licenseNo: current.licenseNo || String(firstValue(profile, "LicenseNo", "licenseNo") || ""),
      licenseExpiryDate: current.licenseExpiryDate || String(firstValue(profile, "LicenseExpiryDate", "licenseExpiryDate") || ""),
    }));
  }, [basicRecord, registrationRecord]);

  useEffect(() => {
    if (!bankRecord) return;
    setBank((current) => ({
      bankName: current.bankName || String(firstValue(bankRecord, "BankName", "bankName") || ""),
      accountNumber: current.accountNumber || String(firstValue(bankRecord, "AccountNo", "accountNo", "accountNumber") || ""),
      ifscCode: current.ifscCode || String(firstValue(bankRecord, "IFSC", "ifscCode") || ""),
      micrCode: current.micrCode || String(firstValue(bankRecord, "MICR", "micrCode") || ""),
    }));
  }, [bankRecord]);

  const activeCategories = useMemo(
    () =>
      (categoriesQuery.data ?? []).filter(
        (item) => item?.IsActive === true || Number(item?.IsActive) === 1,
      ),
    [categoriesQuery.data],
  );
  const activeSubcategories = useMemo(
    () =>
      (subcategoriesQuery.data ?? []).filter(
        (item) => item?.IsActive === true || Number(item?.IsActive) === 1,
      ),
    [subcategoriesQuery.data],
  );
  const existingDocuments = documentsQuery.data ?? [];
  const serviceItems = servicesQuery.data ?? [];
  const stableServiceItems = useMemo(() => {
    return serviceItems
      .map((item, index) => ({
        item,
        index,
        order: serviceOrderRef.current.get(serviceIdOf(item)),
      }))
      .sort(
        (left, right) =>
          (left.order ?? Number.MAX_SAFE_INTEGER) -
            (right.order ?? Number.MAX_SAFE_INTEGER) ||
          left.index - right.index,
      )
      .map(({ item }) => item);
  }, [serviceItems]);
  useEffect(() => {
    serviceItems.forEach((item) => {
      const id = serviceIdOf(item);
      if (id && !serviceOrderRef.current.has(id)) {
        serviceOrderRef.current.set(id, serviceOrderRef.current.size);
      }
    });
  }, [serviceItems]);
  const serviceTree = useMemo(
    () => buildServiceTree(stableServiceItems),
    [stableServiceItems],
  );
  useEffect(() => {
    if (!servicesQuery.isSuccess || serviceExpansionInitialized.current) return;
    setExpandedServiceIds(
      new Set(
        serviceTree
          .filter((node) => node.children.length > 0)
          .map((node) => node.id),
      ),
    );
    serviceExpansionInitialized.current = true;
  }, [serviceTree, servicesQuery.isSuccess]);
  const toggleServiceExpanded = (id) => {
    setExpandedServiceIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const activeSubscription = (subscriptionsQuery.data ?? []).find(
    (item) => Number(firstValue(item, "IsActive", "isActive")) === 1,
  );
  const activeServices = serviceItems.filter(
    (item) => Number(firstValue(item, "IsActive", "isActive")) === 1,
  );
  const maxServices = Number(
    firstValue(activeSubscription, "maxNoofServices", "MaxNoofServices") ||
      0,
  );
  const hasActivePlan =
    Number(firstValue(activeSubscription, "IsActive", "isActive")) === 1;

  const completion = useMemo(() => {
    const done = [
      Boolean(companyType),
      Boolean(
        basic.companyName &&
          basic.contactPerson &&
          basic.email &&
          basic.mobile &&
          basic.address &&
          basic.pinCode.length === 6,
      ),
      Boolean(
        registration.gstNo ||
          registration.panNo ||
          registration.cinNo ||
          registration.aadharNo,
      ),
      existingDocuments.length > 0,
      activeServices.length > 0,
      Boolean(bank.bankName && bank.accountNumber && bank.ifscCode),
    ].filter(Boolean).length;
    return Math.round((done / STEPS.length) * 100);
  }, [activeServices.length, bank, basic, companyType, existingDocuments.length, registration]);

  const updateBasic = (key, value) =>
    setBasic((current) => ({ ...current, [key]: value }));
  const updateRegistration = (key, value) =>
    setRegistration((current) => ({ ...current, [key]: value }));
  const updateBank = (key, value) =>
    setBank((current) => ({ ...current, [key]: value }));

  const saveBasicInformation = async () => {
    if (!companyType) {
      throw new Error("Choose your business type before saving company details.");
    }
    if (!basic.companyName.trim() || !basic.contactPerson.trim()) {
      throw new Error("Enter your company name and contact person.");
    }
    if (!/^\S+@\S+\.\S+$/.test(basic.email.trim())) {
      throw new Error("Enter a valid email address.");
    }
    if (!/^[0-9+\-\s]{10,16}$/.test(basic.mobile.trim())) {
      throw new Error("Enter a valid mobile number.");
    }
    if (basic.pinCode.length !== 6) {
      throw new Error("Enter a valid 6-digit PIN code.");
    }
    if (!basic.address.trim()) throw new Error("Enter your business address.");

    const response = await userBasicInformationSave({
      userId: userId || 0,
      companyTypeId: companyType || "",
      companyTypeName: companyTypeName || "",
      companyName: basic.companyName.trim(),
      email: basic.email.trim(),
      contactNo: basic.mobile.trim(),
      address: basic.address.trim(),
      pinCode: basic.pinCode,
      locationName: basic.locationName || "",
      district: basic.district || "",
      state: basic.state || "",
      country: basic.country || "",
      gstNo: registration.gstNo || "",
      panNo: registration.panNo || "",
      esiNo: registration.esiNo || "",
      cinNo: registration.cinNo || "",
      isMSME: registration.udyogAadhaarToggle ? 1 : 0,
      udyogRegistrationNo: registration.msmeNo || "",
    });
    ensureSuccess(response, "Business information could not be saved.");
    await queryClient.invalidateQueries({
      queryKey: ["company-profile-basic", userId],
    });
  };

  const saveRegistration = async () => {
    const hasIdentifier =
      registration.gstNo ||
      registration.panNo ||
      registration.cinNo ||
      registration.aadharNo;
    if (!hasIdentifier) {
      throw new Error("Add at least one business identification number.");
    }
    const checks = [
      [registration.gstNo, /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "GST number"],
      [registration.panNo, /^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN number"],
      [registration.aadharNo, /^\d{12}$/, "Aadhaar number"],
      [registration.cinNo, /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/, "CIN"],
    ];
    const invalid = checks.find(([value, pattern]) => value && !pattern.test(value));
    if (invalid) throw new Error(`Check the format of your ${invalid[2]}.`);

    const response = await userBasicInformationSave({
      userId: userId || 0,
      companyTypeId: companyType || "",
      companyTypeName: companyTypeName || "",
      companyName: basic.companyName || "",
      email: basic.email || "",
      contactNo: basic.mobile || "",
      address: basic.address || "",
      pinCode: basic.pinCode || "",
      aadharNo: registration.aadharNo || "",
      gstNo: registration.gstNo || "",
      panNo: registration.panNo || "",
      esiNo: registration.esiNo || "",
      cinNo: registration.cinNo || "",
      isMSME: registration.udyogAadhaarToggle ? 1 : 0,
      udyogRegistrationNo: registration.msmeNo || "",
      pfNo: registration.pfNo || "",
      licenseNo: registration.licenseNo || "",
      licenseExpiryDate: registration.licenseExpiryDate || "",
    });
    ensureSuccess(response, "Registration information could not be saved.");
    await queryClient.invalidateQueries({
      queryKey: ["company-profile-basic", userId],
    });
  };

  const saveBankDetails = async () => {
    if (!bank.bankName.trim()) throw new Error("Enter the bank name.");
    if (!/^\d{9,18}$/.test(bank.accountNumber)) {
      throw new Error("Enter an account number between 9 and 18 digits.");
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifscCode.toUpperCase())) {
      throw new Error("Enter a valid IFSC code.");
    }
    const response = await userBankDetailSave({
      userId: userId || 0,
      bankName: bank.bankName.trim(),
      accountNo: bank.accountNumber,
      ifsc: bank.ifscCode.toUpperCase(),
      micr: bank.micrCode || "",
      isPrimaryAccount: 1,
    });
    ensureSuccess(response, "Bank details could not be saved.");
    await queryClient.invalidateQueries({
      queryKey: ["company-profile-bank", userId],
    });
  };

  const runSave = async (action, successMessage, finish = false) => {
    if (saving) return;
    setSaving(true);
    try {
      await action();
      if (finish) {
        if (isProfileGateActive) {
          if (completion >= 75) {
            Alert.alert("Profile saved", successMessage, [
              {
                text: "Continue",
                onPress: () => setProfileGateUnlocked(true),
              },
            ]);
          } else {
            Alert.alert(
              "Bank details saved",
              `Your profile is ${completion}% complete. Complete more sections to reach 75% and continue.`,
            );
          }
        } else {
          Alert.alert("Profile saved", successMessage, [
            {
              text: "Continue to dashboard",
              onPress: () => navigation.navigate(Routes.VendorDashboard),
            },
          ]);
        }
      } else {
        setStep((current) => Math.min(current + 1, STEPS.length - 1));
      }
    } catch (error) {
      Alert.alert("Unable to continue", error?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const findLocations = async () => {
    if (!/^\d{6}$/.test(basic.pinCode)) {
      Alert.alert("Check PIN code", "Enter a valid 6-digit PIN code first.");
      return;
    }
    setLookingUpPin(true);
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${basic.pinCode}`,
      );
      if (!response.ok) throw new Error("PIN code lookup is unavailable.");
      const data = await response.json();
      const result = data?.[0];
      if (result?.Status !== "Success" || !Array.isArray(result?.PostOffice)) {
        setLocations([]);
        Alert.alert("No locations found", "Check the PIN code and try again.");
        return;
      }
      setLocations(result.PostOffice);
    } catch (error) {
      Alert.alert("Location lookup failed", error?.message || "Please try again.");
    } finally {
      setLookingUpPin(false);
    }
  };

  const chooseLocation = (location) => {
    setBasic((current) => ({
      ...current,
      locationName: location.Name || "",
      district: location.District || "",
      state: location.State || "",
      country: location.Country || "",
    }));
    setLocations([]);
  };

  const findExistingDocument = (categoryId, subcategoryId) =>
    existingDocuments.find(
      (item) =>
        String(firstValue(item, "DocumentCategoryID", "documentCategoryID")) ===
          String(categoryId) &&
        String(
          firstValue(item, "DocumentSubCategoryID", "documentSubCategoryID"),
        ) === String(subcategoryId),
    );

  const uploadDocument = async (category, subcategory) => {
    const key = `${category.DocumentCategoryID}-${subcategory.DocumentSubCategoryID}`;
    if (uploadingKey) return;
    setUploadingKey(key);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/tiff",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      const asset = result.assets?.[0] ??
        (result.type === "success" ? result : null);
      if (!asset?.uri) return;
      const name = asset.name || "document";
      const extension = name.split(".").pop()?.toLowerCase();
      if (!["pdf", "jpg", "jpeg", "png", "tiff"].includes(extension)) {
        throw new Error("Choose a PDF, JPG, PNG, or TIFF document.");
      }
      const { base64, size } = await fileToBase64(asset.uri);
      if (size > 5 * 1024 * 1024) {
        throw new Error("Documents must be 5 MB or smaller.");
      }
      const existing = findExistingDocument(
        category.DocumentCategoryID,
        subcategory.DocumentSubCategoryID,
      );
      const payload = {
        userDocumentID: Number(
          firstValue(existing, "UserDocumentID", "userDocumentID"),
        ) || 0,
        userID: userId,
        documentName: name,
        documentCategoryID: category.DocumentCategoryID,
        documentCategoryName: category.DocumentCategoryName,
        documentSubCategoryID: subcategory.DocumentSubCategoryID,
        documentSubCategoryName: subcategory.DocumentSubCategoryName,
        documentPath: "",
        fileExtension: extension,
        documentFileBase64: base64,
        documentFileBytes: "",
        fileSizeKB: Number((size / 1024).toFixed(2)),
      };
      const response = existing
        ? await UserDocumentStoreUpdate(payload)
        : await UserDocumentStoreSave(payload);
      ensureSuccess(response, "The document could not be uploaded.");
      await queryClient.invalidateQueries({
        queryKey: ["company-profile-documents", userId],
      });
    } catch (error) {
      Alert.alert("Upload failed", error?.message || "Please try again.");
    } finally {
      setUploadingKey("");
    }
  };

  const deleteDocument = (document) => {
    const id = firstValue(document, "UserDocumentID", "userDocumentID");
    Alert.alert("Remove document?", "This file will be removed from your profile.", [
      { text: "Keep document", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await UserDocumentStoreDelete(id);
            ensureSuccess(response, "The document could not be removed.");
            await queryClient.invalidateQueries({
              queryKey: ["company-profile-documents", userId],
            });
          } catch (error) {
            Alert.alert("Could not remove document", error?.message || "Please try again.");
          }
        },
      },
    ]);
  };

  const downloadDocument = async (category, subcategory) => {
    const baseUrl = API_BASE_URL.replace(/\/$/, "");
    const url =
      `${baseUrl}/UserDocumentStore/download?userId=${encodeURIComponent(userId)}` +
      `&documentCategoryId=${encodeURIComponent(category.DocumentCategoryID)}` +
      `&documentSubCategoryId=${encodeURIComponent(subcategory.DocumentSubCategoryID)}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "Could not open document",
        error?.message || "Please try again.",
      );
    }
  };

  const activateService = async (service) => {
    const id = serviceIdOf(service);
    if (serviceBusyIdRef.current) return;
    if (!hasActivePlan) {
      Alert.alert(
        "Subscription required",
        "Choose a plan before activating business services.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "View plans",
            onPress: () => navigation.navigate(Routes.PlansAndSubscriptionsScreen),
          },
        ],
      );
      return;
    }
    if (
      maxServices > 0 &&
      activeServices.length >= maxServices
    ) {
      Alert.alert(
        "Plan limit reached",
        `Your current plan allows up to ${maxServices} active services.`,
      );
      return;
    }
    serviceBusyIdRef.current = id;
    setServiceBusyId(id);
    try {
      const userServiceId =
        Number(firstValue(service, "UserServiceID", "userServiceID")) || 0;
      const payload = {
        userServiceID: userServiceId,
        userID: userId,
        serviceID: firstValue(service, "ServiceID", "serviceID", "serviceId"),
        serviceName: firstValue(service, "ServiceName", "serviceName", "name"),
        planID: firstValue(activeSubscription, "PlanID", "planID") || 0,
        planName: firstValue(activeSubscription, "PlanName", "planName") || "",
        amount: Number(firstValue(service, "Amount", "amount")) || 0,
        enterredBy: userId,
        isActive: 1,
      };

      const response = userServiceId
        ? await UserServiceDetailsUpdate(payload)
        : await UserServiceDetailsSave(payload);
      ensureSuccess(response, "The service could not be activated.");
      await queryClient.invalidateQueries({
        queryKey: ["company-profile-services", userId],
      });
    } catch (error) {
      Alert.alert("Could not activate service", error?.message || "Please try again.");
    } finally {
      serviceBusyIdRef.current = "";
      setServiceBusyId("");
    }
  };

  const stepQueries = [
    typesQuery,
    basicQuery,
    registrationQuery,
    categoriesQuery,
    servicesQuery,
    bankQuery,
  ];
  const currentQuery = stepQueries[step];
  const currentStepLoading = currentQuery?.isLoading;
  const currentStepError = currentQuery?.isError;

  if (!userId) {
    return (
      <Screen>
        <ScreenHeader title="Company profile" subtitle="Commercial account" showBack />
        <View style={styles.centerState}>
          <Ionicons name="person-circle-outline" size={34} color={colors.textMuted} />
          <Text style={styles.stateTitle}>Account details unavailable</Text>
          <Text style={styles.stateBody}>
            Sign in again to load and update your business profile.
          </Text>
        </View>
      </Screen>
    );
  }

  const renderBusinessType = () => (
    <>
      <StepIntro
        icon="business-outline"
        title="Choose your business structure"
        detail="Select the organisation type used for your business registration."
      />
      {typesQuery.isLoading ? (
        <LoadingState label="Loading organisation types…" />
      ) : typesQuery.isError ? (
        <ErrorState
          label="Organisation types could not be loaded."
          onRetry={() => typesQuery.refetch()}
        />
      ) : (typesQuery.data ?? []).length === 0 ? (
        <EmptyState label="No organisation types are available right now." />
      ) : (
        <View style={styles.choiceList}>
          {(typesQuery.data ?? []).map((type, index) => {
            const id = String(firstValue(type, "value", "Value", "id", "ID"));
            const title = String(firstValue(type, "label", "Label", "name", "Name"));
            const selected = id === companyType;
            return (
              <Pressable
                key={`${id}-${index}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  setCompanyType(id);
                  setCompanyTypeName(title);
                }}
                style={({ pressed }) => [
                  styles.choiceCard,
                  selected && styles.choiceCardSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.choiceIcon,
                    selected && styles.choiceIconSelected,
                  ]}
                >
                  <Ionicons
                    name="business-outline"
                    size={19}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                </View>
                <View style={styles.choiceCopy}>
                  <Text style={styles.choiceTitle}>{title}</Text>
                  {!!type?.name && type.name !== title && (
                    <Text style={styles.choiceDetail}>{type.name}</Text>
                  )}
                  <Text style={styles.choiceAction}>
                    {selected ? "Selected" : "Choose structure"}
                  </Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </>
  );

  const renderBasicInformation = () => (
    <>
      <StepIntro
        icon="business-outline"
        title="Business identity"
        detail="Add the details customers and partners use to reach your company."
      />
      <SectionCard title="Company and contact" icon="people-outline">
        <Input
          label="Company name"
          value={basic.companyName}
          onChangeText={(value) => updateBasic("companyName", value)}
          placeholder="Registered business name"
          returnKeyType="next"
        />
        <Input
          label="Business type"
          value={companyTypeName}
          editable={false}
          placeholder="Select a business type first"
          leftIcon={<Ionicons name="business-outline" size={17} color={colors.textMuted} />}
        />
        <Input
          label="Contact person"
          value={basic.contactPerson}
          onChangeText={(value) => updateBasic("contactPerson", value)}
          placeholder="Full name"
          autoCapitalize="words"
          returnKeyType="next"
        />
        <Input
          label="Email address"
          value={basic.email}
          onChangeText={(value) => updateBasic("email", value)}
          placeholder="name@company.com"
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
        />
        <Input
          label="Mobile number"
          value={basic.mobile}
          onChangeText={(value) => updateBasic("mobile", value)}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          returnKeyType="next"
        />
      </SectionCard>
      <SectionCard title="Registered address" icon="location-outline">
        <View style={styles.pinRow}>
          <View style={styles.pinInput}>
            <Input
              label="PIN code"
              value={basic.pinCode}
              onChangeText={(value) => {
                updateBasic("pinCode", value.replace(/\D/g, "").slice(0, 6));
                updateBasic("locationName", "");
                updateBasic("district", "");
                updateBasic("state", "");
                updateBasic("country", "");
                setLocations([]);
              }}
              placeholder="6-digit PIN code"
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="search"
              onSubmitEditing={findLocations}
            />
          </View>
          <Pressable
            onPress={findLocations}
            disabled={lookingUpPin}
            style={({ pressed }) => [
              styles.pinLookup,
              pressed && styles.pressed,
              lookingUpPin && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Find PIN code location"
          >
            {lookingUpPin ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="search-outline" size={19} color={colors.primary} />
            )}
          </Pressable>
        </View>
        {locations.length > 0 && (
          <View style={styles.locationOptions}>
            <Text style={styles.locationPrompt}>Choose your post office</Text>
            {locations.slice(0, 8).map((location, index) => (
              <Pressable
                key={`${location.Name}-${index}`}
                onPress={() => chooseLocation(location)}
                style={({ pressed }) => [
                  styles.locationOption,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <View style={styles.locationCopy}>
                  <Text style={styles.locationName}>{location.Name}</Text>
                  <Text style={styles.locationMeta}>
                    {[location.District, location.State].filter(Boolean).join(", ")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}
        {basic.locationName ? (
          <View style={styles.selectedLocation}>
            <Ionicons name="checkmark-circle" size={17} color={colors.success} />
            <Text style={styles.selectedLocationText}>
              {[basic.locationName, basic.district, basic.state]
                .filter(Boolean)
                .join(", ")}
            </Text>
          </View>
        ) : null}
        <Input
          label="Full address"
          value={basic.address}
          onChangeText={(value) => updateBasic("address", value)}
          placeholder="Building, street and area"
          multiline
          textAlignVertical="top"
          style={styles.multilineInput}
        />
      </SectionCard>
    </>
  );

  const renderRegistration = () => (
    <>
      <StepIntro
        icon="shield-checkmark-outline"
        title="Registration and compliance"
        detail="Add the identifiers and compliance details that apply to your business."
      />
      <SectionCard title="Business identifiers" icon="document-text-outline">
        <Input
          label="GST number"
          value={registration.gstNo}
          onChangeText={(value) =>
            updateRegistration("gstNo", value.toUpperCase().slice(0, 15))
          }
          placeholder="15-character GSTIN"
          autoCapitalize="characters"
        />
        <Input
          label="PAN number"
          value={registration.panNo}
          onChangeText={(value) =>
            updateRegistration("panNo", value.toUpperCase().slice(0, 10))
          }
          placeholder="ABCDE1234F"
          autoCapitalize="characters"
        />
        <Input
          label="CIN number"
          value={registration.cinNo}
          onChangeText={(value) =>
            updateRegistration("cinNo", value.toUpperCase().slice(0, 21))
          }
          placeholder="Corporate Identity Number"
          autoCapitalize="characters"
        />
        <Input
          label="Aadhaar number"
          value={registration.aadharNo}
          onChangeText={(value) =>
            updateRegistration("aadharNo", value.replace(/\D/g, "").slice(0, 12))
          }
          placeholder="12-digit Aadhaar number"
          keyboardType="number-pad"
        />
        <InlineNotice>
          Add at least one valid GST, PAN, CIN, or Aadhaar number to continue.
        </InlineNotice>
      </SectionCard>
      <SectionCard title="Additional compliance" icon="clipboard-outline">
        <Input
          label="Provident Fund account number"
          value={registration.pfNo}
          onChangeText={(value) => updateRegistration("pfNo", value)}
          placeholder="PF account number"
          autoCapitalize="characters"
        />
        <Input
          label="ESI number"
          value={registration.esiNo}
          onChangeText={(value) => updateRegistration("esiNo", value)}
          placeholder="ESI registration number"
          autoCapitalize="characters"
        />
        <Input
          label="Trade or shop licence number"
          value={registration.licenseNo}
          onChangeText={(value) => updateRegistration("licenseNo", value)}
          placeholder="Licence number"
          autoCapitalize="characters"
        />
        <Input
          label="Licence expiry date"
          value={registration.licenseExpiryDate}
          onChangeText={(value) => updateRegistration("licenseExpiryDate", value)}
          placeholder="YYYY-MM-DD"
        />
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>MSME registered</Text>
            <Text style={styles.switchDetail}>
              Is your business registered as a micro, small, or medium enterprise?
            </Text>
          </View>
          <Switch
            value={registration.udyogAadhaarToggle}
            onValueChange={(value) =>
              updateRegistration("udyogAadhaarToggle", value)
            }
            trackColor={{ false: "#CBD5E1", true: "#9BB5C9" }}
            thumbColor={registration.udyogAadhaarToggle ? colors.primary : "#fff"}
            accessibilityLabel="MSME registered"
          />
        </View>
        {registration.udyogAadhaarToggle ? (
          <Input
            label="Udyam registration number"
            value={registration.msmeNo}
            onChangeText={(value) => updateRegistration("msmeNo", value)}
            placeholder="UDYAM-MH-01-0012345"
            autoCapitalize="characters"
          />
        ) : null}
      </SectionCard>
    </>
  );

  const renderDocuments = () => (
    <>
      <StepIntro
        icon="folder-open-outline"
        title="Business documents"
        detail="Upload clear copies of the documents requested for your profile."
      />
      <InlineNotice icon="shield-checkmark-outline">
        PDF, JPG, PNG, or TIFF files up to 5 MB. You can replace a document by
        removing it and uploading the updated copy.
      </InlineNotice>
      {categoriesQuery.isLoading ||
      subcategoriesQuery.isLoading ||
      documentsQuery.isLoading ? (
        <LoadingState label="Loading your documents…" />
      ) : categoriesQuery.isError || subcategoriesQuery.isError || documentsQuery.isError ? (
        <ErrorState
          label="Documents could not be loaded."
          onRetry={() => {
            categoriesQuery.refetch();
            subcategoriesQuery.refetch();
            documentsQuery.refetch();
          }}
        />
      ) : activeCategories.length === 0 ? (
        <EmptyState label="No document categories are available right now." />
      ) : (
        <>
          <View style={styles.uploadSummary}>
            <View style={styles.uploadSummaryIcon}>
              <Ionicons name="checkmark-done-outline" size={18} color={colors.success} />
            </View>
            <Text style={styles.uploadSummaryText}>
              {existingDocuments.length} document
              {existingDocuments.length === 1 ? "" : "s"} uploaded
            </Text>
          </View>
          {activeCategories.map((category) => {
            const categoryId = category.DocumentCategoryID;
            const subcategories = activeSubcategories.filter(
              (item) => String(item.DocumentCategoryID) === String(categoryId),
            );
            return (
              <SectionCard
                key={categoryId}
                title={category.DocumentCategoryName || "Documents"}
                icon="folder-open-outline"
              >
                {subcategories.length === 0 ? (
                  <Text style={styles.emptyInline}>
                    No document types are available in this category.
                  </Text>
                ) : (
                  subcategories.map((subcategory) => {
                    const existing = findExistingDocument(
                      categoryId,
                      subcategory.DocumentSubCategoryID,
                    );
                    const key = `${categoryId}-${subcategory.DocumentSubCategoryID}`;
                    return (
                      <View key={key} style={styles.documentRow}>
                        <View style={styles.documentIcon}>
                          <Ionicons
                            name={existing ? "document-text" : "document-text-outline"}
                            size={18}
                            color={existing ? colors.success : colors.primary}
                          />
                        </View>
                        <View style={styles.documentCopy}>
                          <Text style={styles.documentTitle}>
                            {subcategory.DocumentSubCategoryName || "Document"}
                          </Text>
                          {existing ? (
                            <>
                              <Text style={styles.documentName} numberOfLines={1}>
                                {existing.DocumentName}
                              </Text>
                              <Text style={styles.documentMeta}>
                                {String(existing.FileExtension || "").toUpperCase()}
                                {existing.FileSizeKB
                                  ? ` · ${formatBytes(Number(existing.FileSizeKB) * 1024)}`
                                  : ""}
                              </Text>
                            </>
                          ) : (
                            <Text style={styles.documentMeta}>Not uploaded</Text>
                          )}
                        </View>
                        {existing ? (
                          <View style={styles.documentActions}>
                            <Pressable
                              onPress={() => downloadDocument(category, subcategory)}
                              style={({ pressed }) => [
                                styles.documentAction,
                                styles.documentDownload,
                                pressed && styles.pressed,
                              ]}
                              accessibilityRole="button"
                              accessibilityLabel={`Download ${existing.DocumentName}`}
                            >
                              <Ionicons
                                name="download-outline"
                                size={18}
                                color={colors.primary}
                              />
                            </Pressable>
                            <Pressable
                              onPress={() => deleteDocument(existing)}
                              style={({ pressed }) => [
                                styles.documentAction,
                                pressed && styles.pressed,
                              ]}
                              accessibilityRole="button"
                              accessibilityLabel={`Remove ${existing.DocumentName}`}
                            >
                              <Ionicons name="trash-outline" size={18} color={colors.danger} />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => uploadDocument(category, subcategory)}
                            disabled={!!uploadingKey}
                            style={({ pressed }) => [
                              styles.uploadButton,
                              pressed && styles.pressed,
                              !!uploadingKey && styles.disabled,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Upload ${subcategory.DocumentSubCategoryName}`}
                          >
                            {uploadingKey === key ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons name="cloud-upload-outline" size={17} color={colors.primary} />
                            )}
                            <Text style={styles.uploadButtonText}>
                              {uploadingKey === key ? "Adding" : "Add"}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })
                )}
              </SectionCard>
            );
          })}
        </>
      )}
    </>
  );

  const renderServices = () => {
    const renderServiceNode = (node, depth = 0) => {
      const { item: service, id, children } = node;
      const hasChildren = children.length > 0;
      const isExpanded = expandedServiceIds.has(id);
      const isActive =
        Number(firstValue(service, "IsActive", "isActive")) === 1;
      const busy = serviceBusyId === id;
      const serviceName =
        firstValue(service, "ServiceName", "serviceName", "name") ||
        "Business service";
      const description = firstValue(
        service,
        "ServiceDescription",
        "serviceDescription",
        "description",
      );

      return (
        <React.Fragment key={id}>
          <View
            style={[
              styles.serviceRow,
              depth > 0 && styles.serviceNestedRow,
            ]}
          >
            <View
              style={[
                styles.serviceIcon,
                isActive && styles.serviceIconActive,
                depth > 0 && styles.serviceNestedIcon,
              ]}
            >
              <Ionicons
                name={isActive ? "checkmark" : depth > 0 ? "construct-outline" : "briefcase-outline"}
                size={17}
                color={isActive ? colors.success : colors.primary}
              />
            </View>
            <View style={styles.serviceCopy}>
              <Text style={styles.serviceName} numberOfLines={2}>
                {serviceName}
              </Text>
              {!!description && (
                <Text style={styles.serviceDetail} numberOfLines={2}>
                  {description}
                </Text>
              )}
            </View>
            {isActive ? (
              <View style={styles.activeBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.success}
                />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => activateService(service)}
                disabled={!!serviceBusyId}
                style={({ pressed }) => [
                  styles.activateButton,
                  pressed && styles.pressed,
                  !!serviceBusyId && styles.disabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Activate ${serviceName}`}
                accessibilityState={{ busy, disabled: !!serviceBusyId }}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="add" size={17} color={colors.primary} />
                )}
                <Text style={styles.activateText}>
                  {busy ? "Adding" : "Activate"}
                </Text>
              </Pressable>
            )}
            {hasChildren && (
              <Pressable
                onPress={() => toggleServiceExpanded(id)}
                style={({ pressed }) => [
                  styles.serviceExpand,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${isExpanded ? "Collapse" : "Expand"} ${serviceName} sub-services`}
                accessibilityState={{ expanded: isExpanded }}
                hitSlop={4}
              >
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={17}
                  color={colors.textMuted}
                />
              </Pressable>
            )}
          </View>
          {hasChildren && isExpanded && (
            <View style={styles.serviceChildren}>
              {children.map((child) =>
                renderServiceNode(child, depth + 1),
              )}
            </View>
          )}
        </React.Fragment>
      );
    };

    return (
      <>
        <StepIntro
          icon="briefcase-outline"
          title="Services you provide"
          detail="Activate the services you want customers to find on your profile."
        />
        {subscriptionsQuery.isLoading || servicesQuery.isLoading ? (
          <LoadingState label="Loading available services…" />
        ) : subscriptionsQuery.isError || servicesQuery.isError ? (
          <ErrorState
            label="Services could not be loaded."
            onRetry={() => {
              subscriptionsQuery.refetch();
              servicesQuery.refetch();
            }}
          />
        ) : (
          <>
            <View
              style={[
                styles.planBanner,
                !hasActivePlan && styles.planBannerWarning,
              ]}
            >
              <View style={styles.planIcon}>
                <Ionicons
                  name={
                    hasActivePlan
                      ? "shield-checkmark-outline"
                      : "card-outline"
                  }
                  size={18}
                  color={hasActivePlan ? colors.success : colors.warning}
                />
              </View>
              <View style={styles.planCopy}>
                <Text style={styles.planTitle}>
                  {hasActivePlan
                    ? `Active plan · ${firstValue(activeSubscription, "PlanName", "planName") || "Business"}`
                    : "A plan is required to activate services"}
                </Text>
                <Text style={styles.planDetail}>
                  {hasActivePlan
                    ? `${activeServices.length}${maxServices ? ` of ${maxServices}` : ""} services active`
                    : "Browse available plans to activate service listings."}
                </Text>
              </View>
              {!hasActivePlan ? (
                <Pressable
                  onPress={() =>
                    navigation.navigate(Routes.PlansAndSubscriptionsScreen)
                  }
                  style={({ pressed }) => [
                    styles.planAction,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="View subscription plans"
                >
                  <Text style={styles.planActionText}>View plans</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={colors.primary}
                  />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.serviceStats}>
              <View style={styles.serviceStat}>
                <Text style={styles.serviceStatValue}>
                  {activeServices.length}
                </Text>
                <Text style={styles.serviceStatLabel}>Active</Text>
              </View>
              <View style={styles.serviceStat}>
                <Text style={styles.serviceStatValue}>
                  {serviceItems.length}
                </Text>
                <Text style={styles.serviceStatLabel}>Available</Text>
              </View>
            </View>
            {serviceTree.length === 0 ? (
              <EmptyState label="No services are available for this account." />
            ) : (
              <SectionCard
                title="Available services"
                icon="briefcase-outline"
              >
                <Text style={styles.serviceTreeHint}>
                  Tap the chevron to browse sub-services.
                </Text>
                {serviceTree.map((node) => renderServiceNode(node))}
              </SectionCard>
            )}
          </>
        )}
      </>
    );
  };

  const renderBanking = () => (
    <>
      <StepIntro
        icon="card-outline"
        title="Settlement account"
        detail="Add the business account where your payments should be settled."
      />
      <SectionCard title="Bank details" icon="business-outline">
        <Input
          label="Bank name"
          value={bank.bankName}
          onChangeText={(value) => updateBank("bankName", value)}
          placeholder="Bank name"
          autoCapitalize="words"
        />
        <Input
          label="Account number"
          value={bank.accountNumber}
          onChangeText={(value) =>
            updateBank("accountNumber", value.replace(/\D/g, "").slice(0, 18))
          }
          placeholder="9–18 digit account number"
          keyboardType="number-pad"
          secureTextEntry
        />
        <Input
          label="IFSC code"
          value={bank.ifscCode}
          onChangeText={(value) =>
            updateBank("ifscCode", value.toUpperCase().slice(0, 11))
          }
          placeholder="e.g. SBIN0001234"
          autoCapitalize="characters"
        />
        <Input
          label="MICR code"
          value={bank.micrCode}
          onChangeText={(value) =>
            updateBank("micrCode", value.replace(/\D/g, "").slice(0, 9))
          }
          placeholder="Optional 9-digit MICR"
          keyboardType="number-pad"
        />
      </SectionCard>
      <InlineNotice icon="lock-closed-outline">
        Bank details are used to set up your business settlement account. Your
        account number is hidden while you enter it.
      </InlineNotice>
    </>
  );

  const renderCurrentStep = () => {
    if (currentStepLoading) {
      return <LoadingState label="Loading your profile details…" />;
    }
    if (currentStepError && step !== 3 && step !== 4) {
      return (
        <ErrorState
          label="We couldn’t load the details for this step."
          onRetry={() => currentQuery?.refetch()}
        />
      );
    }
    switch (step) {
      case 0:
        return renderBusinessType();
      case 1:
        return renderBasicInformation();
      case 2:
        return renderRegistration();
      case 3:
        return renderDocuments();
      case 4:
        return renderServices();
      default:
        return renderBanking();
    }
  };

  const handleContinue = () => {
    if (step === 0) {
      if (!companyType) {
        Alert.alert("Choose a business type", "Select an organisation type to continue.");
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      runSave(saveBasicInformation, "Business information saved.");
      return;
    }
    if (step === 2) {
      runSave(saveRegistration, "Registration details saved.");
      return;
    }
    if (step === 5) {
      runSave(saveBankDetails, "Your business profile is ready.", true);
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const canContinue = step !== 0 || !!companyType;

  return (
    <Screen>
      <ScreenHeader
        title="Company profile"
        subtitle="Commercial account setup"
        showBack={!isProfileGateActive}
        right={
          <View style={styles.headerActions}>
            <View style={styles.headerProgress}>
              <Text style={styles.headerProgressValue}>{completion}%</Text>
              <Text style={styles.headerProgressLabel}>complete</Text>
            </View>
            {isProfileGateActive && completion >= 75 ? (
              <Pressable
                onPress={() => setProfileGateUnlocked(true)}
                style={({ pressed }) => [
                  styles.headerSkip,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Skip profile setup and continue to the app"
              >
                <Text style={styles.headerSkipText}>Skip</Text>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={colors.primary}
                />
              </Pressable>
            ) : null}
          </View>
        }
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Ionicons name="business-outline" size={22} color="#fff" />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>BUSINESS PROFILE</Text>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {basic.companyName || user?.userName || user?.name || "Your business"}
                </Text>
                <Text style={styles.heroSubtitle}>
                  Complete each section to build your company profile.
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion}%` }]} />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stepper}
          >
            {STEPS.map((item, index) => {
              const isCurrent = step === index;
              const isComplete =
                (index === 0 && !!companyType) ||
                (index === 1 &&
                  !!(
                    basic.companyName &&
                    basic.contactPerson &&
                    basic.email &&
                    basic.mobile &&
                    basic.address &&
                    basic.pinCode.length === 6
                  )) ||
                (index === 2 &&
                  !!(
                    registration.gstNo ||
                    registration.panNo ||
                    registration.cinNo ||
                    registration.aadharNo
                  )) ||
                (index === 3 && existingDocuments.length > 0) ||
                (index === 4 && activeServices.length > 0) ||
                (index === 5 && !!(bank.bankName && bank.accountNumber && bank.ifscCode));
              return (
                <Pressable
                  key={item.title}
                  onPress={() => setStep(index)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isCurrent }}
                  style={({ pressed }) => [
                    styles.stepperItem,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.stepperIcon,
                      isCurrent && styles.stepperIconCurrent,
                      !isCurrent && isComplete && styles.stepperIconComplete,
                    ]}
                  >
                    <Ionicons
                      name={isComplete && !isCurrent ? "checkmark" : item.icon}
                      size={17}
                      color={
                        isCurrent
                          ? "#fff"
                          : isComplete
                            ? colors.primary
                            : colors.textMuted
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.stepperLabel,
                      isCurrent && styles.stepperLabelCurrent,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.panel}>
            <View style={styles.panelHeading}>
              <View>
                <Text style={styles.panelStep}>
                  STEP {step + 1} OF {STEPS.length}
                </Text>
                <Text style={styles.panelTitle}>{STEPS[step].title}</Text>
              </View>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>
                  {String(step + 1).padStart(2, "0")}
                </Text>
              </View>
            </View>
            {renderCurrentStep()}
            <View style={styles.actions}>
              {step > 0 ? (
                <Button
                  title="Back"
                  variant="outline"
                  onPress={() => setStep((current) => Math.max(0, current - 1))}
                  style={styles.backButton}
                  icon={<Ionicons name="arrow-back" size={16} color={colors.primary} />}
                />
              ) : (
                <View style={styles.backButton} />
              )}
              <Button
                title={step === STEPS.length - 1 ? "Save and finish" : "Save and continue"}
                onPress={handleContinue}
                loading={saving}
                disabled={!canContinue || !!currentStepError}
                style={styles.continueButton}
                icon={
                  step === STEPS.length - 1 ? (
                    <Ionicons name="checkmark" size={17} color="#fff" />
                  ) : (
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  )
                }
              />
            </View>
          </View>
          <Text style={styles.footerHint}>
            Your information is saved securely and can be updated later.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function LoadingState({ label }) {
  return (
    <View style={styles.stateBox} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.stateBody}>{label}</Text>
    </View>
  );
}

function ErrorState({ label, onRetry }) {
  return (
    <View style={styles.stateBox}>
      <View style={styles.stateIconError}>
        <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
      </View>
      <Text style={styles.stateBody}>{label}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EmptyState({ label }) {
  return (
    <View style={styles.stateBox}>
      <View style={styles.stateIcon}>
        <Ionicons name="file-tray-outline" size={22} color={colors.textMuted} />
      </View>
      <Text style={styles.stateBody}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerProgress: {
    minWidth: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerProgressValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  headerProgressLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "600",
  },
  headerSkip: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 11,
    backgroundColor: "#EDF4FA",
  },
  headerSkipText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "750",
  },
  hero: {
    padding: spacing.lg,
    borderRadius: 19,
    backgroundColor: colors.primary,
    gap: spacing.lg,
    overflow: "hidden",
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroCopy: { flex: 1, minWidth: 0 },
  heroEyebrow: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.15,
    marginBottom: 4,
  },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "750", lineHeight: 23 },
  heroSubtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.74)",
    fontSize: 11,
    lineHeight: 16,
  },
  progressTrack: {
    height: 5,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  stepper: { paddingVertical: 2, gap: spacing.sm },
  stepperItem: {
    width: 82,
    minHeight: 70,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
  },
  stepperIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stepperIconCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepperIconComplete: {
    borderColor: "#D6E4EE",
    backgroundColor: "#EDF4FA",
  },
  stepperLabel: {
    maxWidth: 82,
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "650",
    textAlign: "center",
  },
  stepperLabelCurrent: { color: colors.primary, fontWeight: "800" },
  panel: {
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...{
      shadowColor: "#123B62",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.045,
      shadowRadius: 14,
      elevation: 2,
    },
  },
  panelHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  panelStep: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  panelTitle: {
    marginTop: 4,
    color: colors.text,
    fontSize: 19,
    fontWeight: "750",
    letterSpacing: -0.3,
  },
  stepNumber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F8",
  },
  stepNumberText: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  stepIntro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stepIntroIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF4FA",
  },
  stepIntroCopy: { flex: 1, minWidth: 0, paddingTop: 1 },
  stepIntroTitle: { color: colors.text, ...typography.bodyBold },
  stepIntroDetail: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  choiceList: { gap: spacing.sm },
  choiceCard: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  choiceCardSelected: {
    borderColor: "#87A8C1",
    backgroundColor: "#F4F8FB",
  },
  choiceIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  choiceIconSelected: { backgroundColor: "#E3EEF6" },
  choiceCopy: { flex: 1, minWidth: 0 },
  choiceTitle: { color: colors.text, ...typography.bodyBold },
  choiceDetail: { marginTop: 2, color: colors.textMuted, ...typography.small },
  choiceAction: {
    marginTop: 4,
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#B7C3CE",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary },
  sectionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E7EDF3",
    backgroundColor: "#FAFBFC",
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF4FA",
  },
  sectionTitle: { flex: 1, color: colors.text, ...typography.bodyBold },
  multilineInput: { minHeight: 82, paddingTop: spacing.sm },
  pinRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  pinInput: { flex: 1 },
  pinLookup: {
    width: 46,
    height: 46,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8E3EC",
    backgroundColor: "#EDF4FA",
    alignItems: "center",
    justifyContent: "center",
  },
  locationOptions: { marginBottom: spacing.md, gap: spacing.xs },
  locationPrompt: {
    marginBottom: spacing.xs,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  locationOption: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  locationCopy: { flex: 1 },
  locationName: { color: colors.text, fontSize: 12, fontWeight: "650" },
  locationMeta: { marginTop: 2, color: colors.textMuted, fontSize: 10 },
  selectedLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: "#EFF7F1",
  },
  selectedLocationText: { flex: 1, color: "#3D6F4E", fontSize: 11, fontWeight: "600" },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFE9F1",
    backgroundColor: "#F3F7FA",
  },
  noticeText: { flex: 1, color: "#53697D", fontSize: 11, lineHeight: 16 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  switchCopy: { flex: 1 },
  switchTitle: { color: colors.text, ...typography.bodyBold },
  switchDetail: { marginTop: 3, color: colors.textMuted, fontSize: 11, lineHeight: 15 },
  uploadSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DFEAE3",
    backgroundColor: "#F5F9F6",
  },
  uploadSummaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E7F2EA",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadSummaryText: { color: "#456A50", fontSize: 12, fontWeight: "700" },
  documentRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  documentIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF4FA",
  },
  documentCopy: { flex: 1, minWidth: 0 },
  documentTitle: { color: colors.text, fontSize: 12, fontWeight: "700" },
  documentName: { marginTop: 2, color: colors.textMuted, fontSize: 10 },
  documentMeta: { marginTop: 3, color: colors.textMuted, fontSize: 10 },
  documentAction: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#FDF1F1",
  },
  documentActions: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  documentDownload: { backgroundColor: "#EDF4FA" },
  uploadButton: {
    minWidth: 70,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 11,
    backgroundColor: "#EDF4FA",
  },
  uploadButtonText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  emptyInline: {
    paddingVertical: spacing.md,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "center",
  },
  planBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE9E0",
    backgroundColor: "#F5F9F6",
  },
  planBannerWarning: { borderColor: "#EEE5D2", backgroundColor: "#FCF9F2" },
  planIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3EC",
  },
  planCopy: { flex: 1, minWidth: 0 },
  planTitle: { color: colors.text, fontSize: 11, fontWeight: "750" },
  planDetail: { marginTop: 3, color: colors.textMuted, fontSize: 10 },
  planAction: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    backgroundColor: "#EDF4FA",
  },
  planActionText: { color: colors.primary, fontSize: 10, fontWeight: "750" },
  serviceStats: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  serviceStat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  serviceStatValue: { color: colors.primary, fontSize: 20, fontWeight: "800" },
  serviceStatLabel: { marginTop: 2, color: colors.textMuted, fontSize: 10 },
  serviceRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  serviceNestedRow: { minHeight: 62 },
  serviceChildren: {
    marginLeft: spacing.xs,
    paddingLeft: spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: "#DCE6EF",
  },
  serviceNestedIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF4FA",
  },
  serviceIconActive: { backgroundColor: "#EAF3EC" },
  serviceCopy: { flex: 1, minWidth: 0 },
  serviceName: { color: colors.text, fontSize: 12, fontWeight: "700" },
  serviceDetail: { marginTop: 3, color: colors.textMuted, fontSize: 10, lineHeight: 14 },
  serviceTreeHint: {
    marginBottom: spacing.xs,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },
  serviceExpand: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#F4F7FA",
  },
  activeBadge: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    backgroundColor: "#EFF7F1",
  },
  activeBadgeText: { color: "#43744F", fontSize: 10, fontWeight: "700" },
  activateButton: {
    minWidth: 82,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D9E5EE",
    backgroundColor: "#fff",
  },
  activateText: { color: colors.primary, fontSize: 10, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  backButton: { minWidth: 88 },
  continueButton: { flex: 1, minHeight: 48 },
  footerHint: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },
  stateBox: {
    minHeight: 132,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xl,
  },
  stateIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  stateIconError: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDF1F1",
  },
  stateTitle: { color: colors.text, ...typography.h3, textAlign: "center" },
  stateBody: {
    maxWidth: 260,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: "#EDF4FA",
  },
  retryText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.48 },
});
