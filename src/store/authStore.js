import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_PREFIX } from "@/constants/config";
import {
  authenticate,
  resendEmailOtp,
  resendMobileOtp,
  saveRegistration,
  setRegistrationPassword,
  verifyEmail,
  verifyMobile,
} from "@/api/auth";
import { clearAuthTokens } from "@/api/authSession";
const K_ONB = `${STORAGE_PREFIX}:onboarded`;

function isSuccessful(result) {
  const status = result?.status;
  return (
    status === true ||
    status === 1 ||
    ["true", "1", "success"].includes(String(status).toLowerCase())
  );
}

function roleForUserType(role) {
  const userType = String(role ?? "").trim().toLowerCase();
  if (["0", "admin"].includes(userType)) return "admin";
  if (["1", "individual"].includes(userType)) return "individual";
  if (["2", "commercial"].includes(userType)) return "commercial";
  return null;
}

export const useAuthStore = create((set, get) => ({
  user: null,
  pendingLogin: null,
  hydrated: false,
  hasOnboarded: false,
  async hydrate() {
    try {
      const onb = await AsyncStorage.getItem(K_ONB);
      set({ hasOnboarded: onb === "1" });
    } finally {
      set({ hydrated: true });
    }
  },
  async signInWithPassword(email, password) {
    const response = await authenticate(email.trim(), password);

    if (response?.isLoginSuccessful !== true) {
      throw new Error(
        response?.remark ||
          response?.message ||
          "Email or password is incorrect",
      );
    }
    const role =
      roleForUserType(response?.primaryRole) ??
      roleForUserType(response?.userType) ??
      roleForUserType(response?.userRole);
    if (!response?.value || !role) {
      throw new Error(
        "The login response is missing a verification challenge or supported user role",
      );
    }
    // setAuthTokens(response?.authToken, response?.refreshToken);
    const pendingLogin = {
      id: String(response?.value),
      activationCode: response?.activationCode || String(response?.value),
      mobile: String(response?.mobileNo || ""),
      email: email?.trim(),
      role,
      userId: response?.userId,
      userName: response?.userName,
      authToken: response?.authToken,
      userRole: response?.userRole,
      remark: response?.remark,
      userType: response?.userType,
      isLoginSuccessful: response?.isLoginSuccessful,
      // refreshToken: response?.refreshToken,
      // refreshTokenExpiryTime: response?.refreshTokenExpiryTime,
    };
    set({ pendingLogin });
    return {
      challengeId: pendingLogin.id,
      mobile: pendingLogin.mobile,
      remark: pendingLogin.remark,
    };
  },
  async verifyOtp(challengeId, code) {
    const pendingLogin = get().pendingLogin;
    if (!pendingLogin || pendingLogin.id !== String(challengeId)) {
      throw new Error(
        "Your login verification has expired. Please sign in again.",
      );
    }
    const response = await verifyMobile(String(challengeId), code);
    if (!isSuccessful(response)) {
      throw new Error(
        response?.message ||
          response?.error ||
          "The verification code is incorrect",
      );
    }
    set({
      user: {
        id: pendingLogin.id,
        email: pendingLogin.email,
        mobile: pendingLogin.mobile,
        role: pendingLogin.role,
        userId: pendingLogin.userId,
        userName: pendingLogin.userName,
        userRole: pendingLogin.userRole,
        remark: pendingLogin.remark,
        userType: pendingLogin.userType,
        isLoginSuccessful: pendingLogin.isLoginSuccessful,
      },
      pendingLogin: null,
    });
  },
  async resendOtp(challengeId) {
    const response = await resendMobileOtp(String(challengeId));
    if (
      response?.status === false ||
      String(response?.status).toLowerCase() === "error"
    ) {
      throw new Error(
        response?.message || response?.error || "Could not resend the code",
      );
    }
  },
  async register(input) {
    const response = await saveRegistration(input);
    const id =
      response?.value ??
      response?.data?.value ??
      response?.data?.id ??
      response?.id;
    if (response?.status === false || !id) {
      throw new Error(
        response?.message ||
          response?.remark ||
          "Registration could not be completed",
      );
    }
    return { id: String(id) };
  },
  async verifyRegistrationEmail(id, otp) {
    const response = await verifyEmail(id, otp);
    if (
      response?.status === false ||
      String(response?.status).toLowerCase() === "error"
    ) {
      throw new Error(
        response?.message || response?.error || "The email code is incorrect",
      );
    }
  },
  async verifyRegistrationMobile(id, otp) {
    const response = await verifyMobile(id, otp);
    if (
      response?.status === false ||
      String(response?.status).toLowerCase() === "error"
    ) {
      throw new Error(
        response?.message || response?.error || "The mobile code is incorrect",
      );
    }
  },
  async resendRegistrationOtp(id, type) {
    const response =
      type === "email" ? await resendEmailOtp(id) : await resendMobileOtp(id);
    if (
      response?.status === false ||
      String(response?.status).toLowerCase() === "error"
    ) {
      throw new Error(
        response?.message || response?.error || "Could not resend the code",
      );
    }
  },
  async completeRegistration(id, password) {
    const response = await setRegistrationPassword(id, password);
    if (
      response?.status === false ||
      String(response?.status).toLowerCase() === "error"
    ) {
      throw new Error(
        response?.message || response?.error || "Could not set the password",
      );
    }
  },
  async signOut() {
    clearAuthTokens();
    set({ user: null, pendingLogin: null });
  },
  async completeOnboarding() {
    await AsyncStorage.setItem(K_ONB, "1");
    set({ hasOnboarded: true });
  },
  setUser(u) {
    set({ user: u });
  },
}));
