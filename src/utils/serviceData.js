import dayjs from "dayjs";
import {
  CheckValidityGet,
  planMasterGetById,
  ServiceMenuGet,
  UserSubscriptionDetailGet,
  userServicesdetailsGetByParam,
  getUserRegistrationbyParam,
} from "../api/api";

export const PALETTE = [
  { activeBg: "#4f46e5", softBg: "#eef2ff", softText: "#4338ca", dot: "#6366f1" },
  { activeBg: "#0e7490", softBg: "#ecfeff", softText: "#0e7490", dot: "#0891b2" },
  { activeBg: "#047857", softBg: "#ecfdf5", softText: "#047857", dot: "#059669" },
  { activeBg: "#b45309", softBg: "#fffbeb", softText: "#b45309", dot: "#d97706" },
  { activeBg: "#be123c", softBg: "#fff1f2", softText: "#be123c", dot: "#e11d48" },
  { activeBg: "#6d28d9", softBg: "#f5f3ff", softText: "#6d28d9", dot: "#7c3aed" },
];
export const col = (depth) => PALETTE[depth % PALETTE.length];

export const unwrap = (res) => {
  let data = res?.data ?? res ?? [];
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { data = []; }
  }
  return Array.isArray(data) ? data : [];
};

export const normalizeServiceMenu = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.items)) return payload.items;
  if (payload && typeof payload === "object") {
    const nested = Object.values(payload).find((v) => Array.isArray(v));
    if (nested) return nested;
  }
  return [];
};

export const buildTree = (flat) => {
  if (!Array.isArray(flat) || !flat.length) return [];
  const map = {};
  flat.forEach((item) => {
    map[item?.ServiceID] = { ...item, children: [] };
  });
  const roots = [];
  flat.forEach((item) => {
    const pid = item?.ParentServiceID ?? 0;
    const node = map[item?.ServiceID];
    if (!pid || !map[pid]) roots.push(node);
    else map[pid].children.push(node);
  });
  return roots;
};

export const flattenTree = (nodes, out = []) => {
  nodes.forEach((n) => {
    out.push(n);
    if (n.children?.length) flattenTree(n.children, out);
  });
  return out;
};

export const allIds = (nodes, out = []) => {
  nodes.forEach((n) => {
    out.push(n.ServiceID);
    allIds(n.children ?? [], out);
  });
  return out;
};

export const findNode = (nodes, id) => {
  for (const n of nodes) {
    if (n.ServiceID === id) return n;
    const found = findNode(n.children ?? [], id);
    if (found) return found;
  }
  return null;
};

export const findFirstLeaf = (node) => {
  if (!node?.children?.length) return node;
  return findFirstLeaf(node.children[0]);
};

// Every ancestor of targetId, excluding targetId itself.
export const getAncestorIds = (tree, targetId) => {
  const path = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      path.push(n.ServiceID);
      if (n.ServiceID === targetId) return true;
      if (walk(n.children ?? [])) return true;
      path.pop();
    }
    return false;
  };
  walk(tree);
  return new Set(path.filter((id) => id !== targetId));
};

export const subtreeHasActive = (node, activeId) => {
  if (!activeId) return false;
  if (node?.ServiceID === activeId) return true;
  return (node?.children ?? []).some((c) => subtreeHasActive(c, activeId));
};

export const fetchMenu = async () => normalizeServiceMenu(await ServiceMenuGet());

export const fetchContractors = async (serviceId) => {
  if (!serviceId) return [];
  return unwrap(
    await userServicesdetailsGetByParam(`serviceId=${serviceId}&userId=${0}&userType=2`),
  );
};

export const fetchSubscriptions = async (userId) =>
  unwrap(await UserSubscriptionDetailGet(`userId=${userId}`));

export const checkValidity = async (userId) => CheckValidityGet(`userId=${userId}`);

export const fetchPlans = async (userType) =>
  unwrap(await planMasterGetById(`userType=${userType}`));

export const fetchRegistration = async (userId) =>
  unwrap(await getUserRegistrationbyParam(`?userId=${userId}`));