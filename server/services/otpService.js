import twilio from "twilio";

/**
 * Interface / Base Class for OTP Providers
 */
class BaseOtpProvider {
  /**
   * @param {string} phone - Normalized E.164 phone number (+91XXXXXXXXXX)
   * @returns {Promise<{ success: boolean, message?: string }>}
   */
  async sendOtp(phone) {
    throw new Error("sendOtp not implemented");
  }

  /**
   * @param {string} phone - Normalized E.164 phone number (+91XXXXXXXXXX)
   * @param {string} otp - The numeric OTP entered by the user
   * @returns {Promise<{ verified: boolean, message?: string }>}
   */
  async verifyOtp(phone, otp) {
    throw new Error("verifyOtp not implemented");
  }

  /**
   * Resends an OTP. Providers that handle resend natively can override this.
   * By default, it delegates to sendOtp.
   * @param {string} phone - Normalized E.164 phone number
   * @returns {Promise<{ success: boolean, message?: string }>}
   */
  async resendOtp(phone) {
    return this.sendOtp(phone);
  }
}

/**
 * Twilio Verify API v2 Provider
 */
class TwilioVerifyProvider extends BaseOtpProvider {
  constructor() {
    super();
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    }
  }

  _ensureConfigured() {
    if (!this.accountSid || !this.authToken || !this.serviceSid) {
      throw new Error(
        "Twilio Verify is not fully configured. Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_VERIFY_SERVICE_SID."
      );
    }
    if (!this.client) {
      this.client = twilio(this.accountSid, this.authToken);
    }
  }

  async sendOtp(phone) {
    this._ensureConfigured();
    try {
      const verification = await this.client.verify.v2
        .services(this.serviceSid)
        .verifications.create({
          to: phone,
          channel: "sms",
        });

      return {
        success: verification.status === "pending",
        message: "OTP sent successfully",
      };
    } catch (error) {
      // Avoid logging sensitive information
      console.error("Twilio Verify send error status:", error.status || 500);
      throw new Error("Unable to send OTP. Please try again later.");
    }
  }

  async verifyOtp(phone, otp) {
    this._ensureConfigured();
    try {
      const verificationCheck = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks.create({
          to: phone,
          code: otp,
        });

      const isApproved = verificationCheck.status === "approved";
      return {
        verified: isApproved,
        message: isApproved ? "OTP verified successfully" : "Invalid or expired OTP",
      };
    } catch (error) {
      // 404 or 400 from Twilio Verify usually indicates expired or non-existent verification
      if (error.status === 404 || error.status === 400) {
        return {
          verified: false,
          message: "Invalid or expired OTP",
        };
      }
      console.error("Twilio Verify check error status:", error.status || 500);
      throw new Error("Failed to verify OTP. Please try again.");
    }
  }
}

/**
 * MSG91 OTP API Provider
 */
class Msg91Provider extends BaseOtpProvider {
  constructor() {
    super();
    this.authKey = process.env.MSG91_AUTH_KEY || process.env.OTP_API_KEY;
    this.templateId = process.env.MSG91_TEMPLATE_ID || process.env.OTP_TEMPLATE_ID;
  }

  _ensureConfigured() {
    if (!this.authKey || !this.templateId) {
      throw new Error(
        "MSG91 is not fully configured. Missing MSG91_AUTH_KEY or MSG91_TEMPLATE_ID."
      );
    }
  }

  async sendOtp(phone) {
    this._ensureConfigured();
    // MSG91 expects number without '+' e.g. '919876543210'
    const cleanNumber = phone.replace(/^\+/, "");
    try {
      const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(
        this.templateId
      )}&mobile=${encodeURIComponent(cleanNumber)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          authkey: this.authKey,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.type === "success" || response.ok) {
        return { success: true, message: "OTP sent successfully" };
      }

      console.error("MSG91 send response type:", data.type);
      throw new Error("Unable to send OTP. Please try again later.");
    } catch (error) {
      console.error("MSG91 send error");
      throw new Error("Unable to send OTP. Please try again later.");
    }
  }

  async verifyOtp(phone, otp) {
    this._ensureConfigured();
    const cleanNumber = phone.replace(/^\+/, "");
    try {
      const url = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(
        otp
      )}&mobile=${encodeURIComponent(cleanNumber)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          authkey: this.authKey,
        },
      });

      const data = await response.json();
      const isApproved = data.type === "success";
      return {
        verified: isApproved,
        message: isApproved ? "OTP verified successfully" : "Invalid or expired OTP",
      };
    } catch (error) {
      console.error("MSG91 verify error");
      return {
        verified: false,
        message: "Invalid or expired OTP",
      };
    }
  }

  async resendOtp(phone) {
    this._ensureConfigured();
    const cleanNumber = phone.replace(/^\+/, "");
    try {
      const url = `https://control.msg91.com/api/v5/otp/retry?mobile=${encodeURIComponent(
        cleanNumber
      )}&retrytype=text`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          authkey: this.authKey,
        },
      });

      const data = await response.json();
      return {
        success: data.type === "success" || response.ok,
        message: "OTP resent successfully",
      };
    } catch (error) {
      console.error("MSG91 retry error");
      throw new Error("Unable to resend OTP. Please try again later.");
    }
  }
}

/**
 * Factory and Service Layer
 */
class OtpService {
  constructor() {
    this.provider = null;
  }

  setProvider(providerInstance) {
    this.provider = providerInstance;
  }

  getProvider() {
    if (this.provider) {
      return this.provider;
    }

    const providerType = (process.env.OTP_PROVIDER || "twilio").toLowerCase();

    if (providerType === "msg91") {
      this.provider = new Msg91Provider();
    } else {
      // Default to Twilio Verify
      this.provider = new TwilioVerifyProvider();
    }

    return this.provider;
  }

  /**
   * Send an OTP to a normalized phone number
   * @param {string} phoneNumber - E.164 phone (+91XXXXXXXXXX)
   */
  async sendOtp(phoneNumber) {
    return this.getProvider().sendOtp(phoneNumber);
  }

  /**
   * Verify an OTP for a normalized phone number
   * @param {string} phoneNumber - E.164 phone (+91XXXXXXXXXX)
   * @param {string} otp - 6-digit OTP code
   */
  async verifyOtp(phoneNumber, otp) {
    return this.getProvider().verifyOtp(phoneNumber, otp);
  }

  /**
   * Resend an OTP to a normalized phone number
   * @param {string} phoneNumber - E.164 phone (+91XXXXXXXXXX)
   */
  async resendOtp(phoneNumber) {
    return this.getProvider().resendOtp(phoneNumber);
  }
}

export const otpService = new OtpService();
export { BaseOtpProvider, TwilioVerifyProvider, Msg91Provider };
