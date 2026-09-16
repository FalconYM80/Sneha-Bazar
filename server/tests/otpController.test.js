import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { otpService, BaseOtpProvider } from "../services/otpService.js";
import { otpRateStore } from "../services/otpRateStore.js";
import { sendOtp, verifyOtp, resendOtp } from "../controllers/otpController.js";
import { registerCustomer, loginCustomer } from "../controllers/customerAuthController.js";
import Customer from "../models/Customer.js";

// Mock Response Helper
function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

// Mock OTP Provider for testing
class MockTestOtpProvider extends BaseOtpProvider {
  constructor() {
    super();
    this.validOtps = new Map(); // phone -> otp
    this.shouldFailSend = false;
    this.shouldExpireOtp = false;
  }

  async sendOtp(phone) {
    if (this.shouldFailSend) {
      throw new Error("SMS provider network error");
    }
    this.validOtps.set(phone, "123456");
    return { success: true, message: "OTP sent successfully" };
  }

  async verifyOtp(phone, otp) {
    if (this.shouldExpireOtp) {
      return { verified: false, message: "Invalid or expired OTP" };
    }
    const expected = this.validOtps.get(phone);
    const verified = expected === otp;
    return {
      verified,
      message: verified ? "OTP verified successfully" : "Invalid or expired OTP",
    };
  }

  async resendOtp(phone) {
    return this.sendOtp(phone);
  }
}

describe("OTP Verification & Customer Auth System", () => {
  let mockProvider;
  const testPhone = "9876543210";
  const normalizedTestPhone = "+919876543210";

  beforeEach(() => {
    process.env.CUSTOMER_JWT_SECRET = "test_customer_jwt_secret_key_12345";
    mockProvider = new MockTestOtpProvider();
    otpService.setProvider(mockProvider);
    otpRateStore.reset();
  });

  describe("5. OTP send success", () => {
    it("successfully sends OTP to a valid Indian phone", async () => {
      const req = { body: { phone: testPhone } };
      const res = createMockRes();

      await sendOtp(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.message, "OTP sent successfully");
      // OTP value is NOT exposed in response
      assert.equal(res.body.otp, undefined);
    });
  });

  describe("6. OTP send failure", () => {
    it("handles provider failure gracefully without leaking technical secrets", async () => {
      mockProvider.shouldFailSend = true;
      const req = { body: { phone: testPhone } };
      const res = createMockRes();

      await sendOtp(req, res);

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Unable to send OTP/);
    });
  });

  describe("7. Correct OTP verification", () => {
    it("verifies correct 6-digit OTP and returns signed verificationToken", async () => {
      // First send OTP
      await sendOtp({ body: { phone: testPhone } }, createMockRes());

      const req = { body: { phone: testPhone, otp: "123456" } };
      const res = createMockRes();

      await verifyOtp(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.verified, true);
      assert.ok(res.body.verificationToken);

      // Verify token authenticity
      const decoded = jwt.verify(res.body.verificationToken, process.env.CUSTOMER_JWT_SECRET);
      assert.equal(decoded.phone, normalizedTestPhone);
      assert.equal(decoded.purpose, "phone_verification");
    });
  });

  describe("8. Incorrect OTP", () => {
    it("rejects incorrect OTP", async () => {
      await sendOtp({ body: { phone: testPhone } }, createMockRes());

      const req = { body: { phone: testPhone, otp: "999999" } };
      const res = createMockRes();

      await verifyOtp(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.verified, false);
      assert.match(res.body.message, /Invalid or expired OTP/);
    });
  });

  describe("9. Expired OTP", () => {
    it("handles expired OTP rejection", async () => {
      await sendOtp({ body: { phone: testPhone } }, createMockRes());
      mockProvider.shouldExpireOtp = true;

      const req = { body: { phone: testPhone, otp: "123456" } };
      const res = createMockRes();

      await verifyOtp(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.verified, false);
      assert.match(res.body.message, /Invalid or expired OTP/);
    });
  });

  describe("10. Too many verification attempts", () => {
    it("locks out verification after 5 consecutive failed attempts", async () => {
      await sendOtp({ body: { phone: testPhone } }, createMockRes());

      // Perform 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const req = { body: { phone: testPhone, otp: "000000" } };
        const res = createMockRes();
        await verifyOtp(req, res);
      }

      // 6th attempt should be blocked with rate limiting
      const req = { body: { phone: testPhone, otp: "123456" } };
      const res = createMockRes();
      await verifyOtp(req, res);

      assert.equal(res.statusCode, 429);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Too many failed attempts|Maximum verification attempts/);
    });
  });

  describe("11. Resend cooldown", () => {
    it("enforces 60s cooldown before allowing resend", async () => {
      // Send first OTP
      await sendOtp({ body: { phone: testPhone } }, createMockRes());

      // Immediate resend should be rejected
      const req = { body: { phone: testPhone } };
      const res = createMockRes();
      await resendOtp(req, res);

      assert.equal(res.statusCode, 429);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Please wait/);
      assert.ok(res.body.retryAfter > 0);
    });
  });

  describe("12. Changing phone number after OTP was sent", () => {
    it("prevents using an OTP verification token from phone A to register phone B", async () => {
      const phoneA = "9876543210";
      const phoneB = "8123456789";

      // Verify phone A
      await sendOtp({ body: { phone: phoneA } }, createMockRes());
      const verifyRes = createMockRes();
      await verifyOtp({ body: { phone: phoneA, otp: "123456" } }, verifyRes);
      const tokenA = verifyRes.body.verificationToken;

      // Attempt to register phone B using token A
      const regReq = {
        body: {
          name: "Test User",
          phone: phoneB,
          password: "password123",
          verificationToken: tokenA,
        },
      };
      const regRes = createMockRes();
      await registerCustomer(regReq, regRes);

      assert.equal(regRes.statusCode, 403);
      assert.equal(regRes.body.success, false);
      assert.match(regRes.body.message, /Mobile verification is invalid for this phone number/);
    });
  });

  describe("13 & 14. Signup with and without verification", () => {
    it("14. Rejects signup attempt without OTP verification", async () => {
      const regReq = {
        body: {
          name: "Unverified User",
          phone: testPhone,
          password: "password123",
        },
      };
      const regRes = createMockRes();
      await registerCustomer(regReq, regRes);

      assert.equal(regRes.statusCode, 403);
      assert.equal(regRes.body.success, false);
      assert.match(regRes.body.message, /Mobile number has not been verified/);
    });

    it("13. Allows signup with valid verificationToken and marks phoneVerified: true", async () => {
      // Mock Customer.findOne and Customer.create
      const origFindOne = Customer.findOne;
      const origCreate = Customer.create;

      Customer.findOne = async () => null;
      Customer.create = async (doc) => ({
        _id: "cust_12345",
        name: doc.name,
        phone: doc.phone,
        email: doc.email,
        phoneVerified: doc.phoneVerified,
      });

      try {
        // Generate valid verification token
        await sendOtp({ body: { phone: testPhone } }, createMockRes());
        const verifyRes = createMockRes();
        await verifyOtp({ body: { phone: testPhone, otp: "123456" } }, verifyRes);
        const token = verifyRes.body.verificationToken;

        const regReq = {
          body: {
            name: "Verified User",
            phone: testPhone,
            password: "password123",
            verificationToken: token,
          },
        };
        const regRes = createMockRes();
        await registerCustomer(regReq, regRes);

        assert.equal(regRes.statusCode, 201);
        assert.equal(regRes.body.success, true);
        assert.equal(regRes.body.data.customer.phoneVerified, true);
        assert.equal(regRes.body.data.customer.phone, normalizedTestPhone);
        assert.ok(regRes.body.data.token);
      } finally {
        Customer.findOne = origFindOne;
        Customer.create = origCreate;
      }
    });
  });

  describe("15, 16, 17. Duplicate and unverified account handling", () => {
    it("16 & 17. Rejects duplicate registration for existing verified account", async () => {
      const origFindOne = Customer.findOne;
      Customer.findOne = async () => ({
        _id: "existing_id",
        phone: normalizedTestPhone,
        phoneVerified: true,
      });

      try {
        const token = jwt.sign(
          { phone: normalizedTestPhone, purpose: "phone_verification" },
          process.env.CUSTOMER_JWT_SECRET
        );

        const regReq = {
          body: {
            name: "Duplicate User",
            phone: testPhone,
            password: "password123",
            verificationToken: token,
          },
        };
        const regRes = createMockRes();
        await registerCustomer(regReq, regRes);

        assert.equal(regRes.statusCode, 409);
        assert.equal(regRes.body.success, false);
        assert.match(regRes.body.message, /already exists/);
      } finally {
        Customer.findOne = origFindOne;
      }
    });

    it("15. Handles existing unverified account during login", async () => {
      const origFindOne = Customer.findOne;
      Customer.findOne = () => ({
        select: () => ({
          _id: "unverified_id",
          name: "Old Unverified",
          phone: normalizedTestPhone,
          phoneVerified: false,
          isActive: true,
          matchPassword: async () => true,
        }),
      });

      try {
        const loginReq = {
          body: {
            phone: testPhone,
            password: "password123",
          },
        };
        const loginRes = createMockRes();
        await loginCustomer(loginReq, loginRes);

        assert.equal(loginRes.statusCode, 200);
        assert.equal(loginRes.body.requiresPhoneVerification, true);
        assert.match(loginRes.body.message, /not verified/);
      } finally {
        Customer.findOne = origFindOne;
      }
    });
  });
});
