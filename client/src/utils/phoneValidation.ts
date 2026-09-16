/**
 * Indian Mobile Number Validation and Formatting for Frontend
 *
 * Rules:
 * - Exactly 10 digits
 * - First digit must be 6, 7, 8, or 9
 */

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const isValidIndianPhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, "");
  return INDIAN_MOBILE_REGEX.test(cleaned);
};

export const normalizeToE164 = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (!INDIAN_MOBILE_REGEX.test(cleaned)) {
    throw new Error("Enter a valid 10-digit mobile number.");
  }
  return `+91${cleaned}`;
};

export const formatIndianPhoneDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "").slice(0, 10);
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
};
