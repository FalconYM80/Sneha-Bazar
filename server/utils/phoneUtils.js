/**
 * Indian mobile number validation and normalization utilities.
 *
 * Rules:
 *  - Exactly 10 digits after stripping the optional +91 / 0 prefix
 *  - First digit must be 6, 7, 8, or 9
 *  - Stored/transmitted in E.164 format: +91XXXXXXXXXX
 */

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * Strip any leading country code or trunk prefix from a raw phone string
 * and return the bare 10-digit portion, or null if it cannot be extracted.
 *
 * Accepted inputs:
 *   "9876543210"       → "9876543210"
 *   "+919876543210"    → "9876543210"
 *   "919876543210"     → "9876543210"
 *   "09876543210"      → "9876543210"
 */
function extractDigits(raw) {
  if (typeof raw !== "string") return null;

  // Remove all whitespace and non-digit characters except leading +
  const cleaned = raw.trim();

  // Strip +91 prefix
  if (cleaned.startsWith("+91")) {
    return cleaned.slice(3).replace(/\D/g, "");
  }

  // Strip 91 prefix (11 digits total)
  const digitsOnly = cleaned.replace(/\D/g, "");
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return digitsOnly.slice(2);
  }

  // Strip leading trunk prefix 0
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    return digitsOnly.slice(1);
  }

  return digitsOnly;
}

/**
 * Returns true if `digits` is a valid 10-digit Indian mobile number.
 * Accepts bare 10-digit strings only (no country code).
 */
function isValidIndianPhone(digits) {
  if (typeof digits !== "string") return false;
  return INDIAN_MOBILE_REGEX.test(digits.trim());
}

/**
 * Normalizes any Indian phone representation to E.164 format.
 * Throws a plain Error with a user-facing message if the number is invalid.
 *
 * @param {string} raw - Raw phone input from user/request
 * @returns {string} E.164 phone number, e.g. "+919876543210"
 */
function normalizeIndianPhone(raw) {
  const digits = extractDigits(raw);

  if (!digits || !isValidIndianPhone(digits)) {
    throw new Error(
      "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
    );
  }

  return `+91${digits}`;
}

/**
 * Returns the bare 10-digit portion from an E.164 Indian number.
 * "+919876543210" → "9876543210"
 */
function e164ToDigits(e164) {
  if (typeof e164 === "string" && e164.startsWith("+91")) {
    return e164.slice(3);
  }
  return e164;
}

export { isValidIndianPhone, normalizeIndianPhone, e164ToDigits, extractDigits };
