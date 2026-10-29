import {
  getUserServicesByParam,
  userBasicInformationbyParam,
  userRegistrationHomeDetails,
  UserRegistrationUserIdGet,
} from "../api/api";

const API_ROOT = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");

export const companyImageUrl = (userId) =>
  API_ROOT && userId
    ? `${API_ROOT}/UserDocumentStore/image?userId=${userId}&documentCategoryId=7&documentSubCategoryId=10`
    : null;

export const initialOf = (name = "") =>
  String(name).trim().charAt(0).toUpperCase() || "C";

export const fetchVerifiedCompanies = async () => {
  const res = await userRegistrationHomeDetails(
    "isVerifiedByAdmin=1&userType=2",
  );
  let data = res?.data ?? [];
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = [];
    }
  }
  return Array.isArray(data) ? data : [];
};

export const toCompanyCard = (item) => ({
  userId: item?.UserId,
  name: item?.CompanyName || "",
  type: item?.UserTypeName || "",
  loc: item?.StateName || "",
  status: item?.Status || "",
});

export const fetchCompanyDetail = async (userId) => {
  const [reg, basic, services] = await Promise.all([
    UserRegistrationUserIdGet(userId),
    userBasicInformationbyParam(`userId=${userId}`),
    getUserServicesByParam(`userId=${userId}`),
  ]);

  return {
    registration: reg?.data?.[0] ?? reg?.data ?? {},
    basic: basic?.data?.[0] ?? {},
    services: Array.isArray(services?.data) ? services.data : [],
  };
};
