export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export const isIndianMobile = (s) => /^[6-9]\d{9}$/.test(s.replace(/\D/g, ''));
export const isGST = (s) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(s);
export const isPAN = (s) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(s);
export const isStrongPassword = (s) => s.length >= 8 && /[A-Z]/.test(s) && /\d/.test(s);
