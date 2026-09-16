/**
 * In-memory store for OTP abuse protection and rate/cooldown management.
 * Tracks per normalized phone number:
 *  - cooldown (e.g. 60 seconds before next send/resend)
 *  - send attempts within rolling window (e.g. max 5 sends per 10 minutes)
 *  - verify attempts (e.g. max 5 attempts before lockout)
 */

const RESEND_COOLDOWN_SECONDS = 60;
const MAX_SEND_ATTEMPTS = 5;
const SEND_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const VERIFY_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout on max attempts

class OtpRateStore {
  constructor() {
    this.store = new Map();
  }

  _getOrCreate(phone) {
    const now = Date.now();
    let record = this.store.get(phone);

    if (!record) {
      record = {
        lastSentAt: 0,
        sendTimestamps: [],
        verifyAttempts: 0,
        lockoutUntil: 0,
      };
      this.store.set(phone, record);
    }

    // Clean up expired send timestamps outside rolling window
    record.sendTimestamps = record.sendTimestamps.filter(
      (ts) => now - ts < SEND_WINDOW_MS
    );

    return record;
  }

  /**
   * Check if an OTP can be sent / resent to this phone.
   * @param {string} phone - Normalized E.164 phone
   * @returns {{ allowed: boolean, message?: string, retryAfter?: number }}
   */
  canSend(phone) {
    const now = Date.now();
    const record = this._getOrCreate(phone);

    // Check lockout from excessive failed verify attempts
    if (record.lockoutUntil > now) {
      const waitSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
      return {
        allowed: false,
        message: `Too many failed attempts. Please try again in ${waitSeconds} seconds.`,
        retryAfter: waitSeconds,
      };
    }

    // Check cooldown (60 seconds)
    if (record.lastSentAt > 0) {
      const elapsedSeconds = Math.floor((now - record.lastSentAt) / 1000);
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        const remaining = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
        return {
          allowed: false,
          message: `Please wait ${remaining}s before requesting a new OTP.`,
          retryAfter: remaining,
        };
      }
    }

    // Check max send attempts in window
    if (record.sendTimestamps.length >= MAX_SEND_ATTEMPTS) {
      const oldest = record.sendTimestamps[0];
      const waitSeconds = Math.ceil((SEND_WINDOW_MS - (now - oldest)) / 1000);
      return {
        allowed: false,
        message: `Maximum OTP requests reached. Please try again in ${Math.ceil(waitSeconds / 60)} minutes.`,
        retryAfter: waitSeconds,
      };
    }

    return { allowed: true };
  }

  /**
   * Record that an OTP was sent to this phone.
   * @param {string} phone - Normalized E.164 phone
   */
  recordSend(phone) {
    const now = Date.now();
    const record = this._getOrCreate(phone);
    record.lastSentAt = now;
    record.sendTimestamps.push(now);
    // Reset verify attempts for the new OTP session if not locked out
    if (record.lockoutUntil <= now) {
      record.verifyAttempts = 0;
    }
  }

  /**
   * Check if a verification attempt can be made for this phone.
   * @param {string} phone - Normalized E.164 phone
   * @returns {{ allowed: boolean, message?: string }}
   */
  canVerify(phone) {
    const now = Date.now();
    const record = this._getOrCreate(phone);

    if (record.lockoutUntil > now) {
      const waitSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
      return {
        allowed: false,
        message: `Too many failed attempts. Account temporarily locked for ${Math.ceil(waitSeconds / 60)} minutes.`,
      };
    }

    if (record.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
      record.lockoutUntil = now + VERIFY_LOCKOUT_MS;
      return {
        allowed: false,
        message: "Maximum verification attempts exceeded. Please request a new OTP later.",
      };
    }

    return { allowed: true };
  }

  /**
   * Record the outcome of a verify attempt.
   * @param {string} phone - Normalized E.164 phone
   * @param {boolean} success - Whether the OTP was valid
   */
  recordVerifyResult(phone, success) {
    const record = this._getOrCreate(phone);
    if (success) {
      // Clear verification tracking on success
      record.verifyAttempts = 0;
      record.lockoutUntil = 0;
    } else {
      record.verifyAttempts += 1;
      if (record.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
        record.lockoutUntil = Date.now() + VERIFY_LOCKOUT_MS;
      }
    }
  }

  /**
   * Clear all records for a phone (useful for tests or after account created).
   */
  reset(phone) {
    if (phone) {
      this.store.delete(phone);
    } else {
      this.store.clear();
    }
  }
}

export const otpRateStore = new OtpRateStore();
