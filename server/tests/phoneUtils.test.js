import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isValidIndianPhone,
  normalizeIndianPhone,
  e164ToDigits,
  extractDigits,
} from "../utils/phoneUtils.js";

describe("Indian Phone Validation & Normalization", () => {
  describe("1. Valid Indian mobile numbers", () => {
    it("accepts valid 10-digit number starting with 9", () => {
      assert.equal(isValidIndianPhone("9876543210"), true);
      assert.equal(normalizeIndianPhone("9876543210"), "+919876543210");
    });

    it("accepts valid 10-digit number starting with 8", () => {
      assert.equal(isValidIndianPhone("8123456789"), true);
      assert.equal(normalizeIndianPhone("8123456789"), "+918123456789");
    });

    it("accepts valid 10-digit number starting with 7", () => {
      assert.equal(isValidIndianPhone("7012345678"), true);
      assert.equal(normalizeIndianPhone("7012345678"), "+917012345678");
    });

    it("accepts valid 10-digit number starting with 6", () => {
      assert.equal(isValidIndianPhone("6123456789"), true);
      assert.equal(normalizeIndianPhone("6123456789"), "+916123456789");
    });

    it("normalizes numbers already with +91 or 91 or trunk 0 prefix", () => {
      assert.equal(normalizeIndianPhone("+919876543210"), "+919876543210");
      assert.equal(normalizeIndianPhone("919876543210"), "+919876543210");
      assert.equal(normalizeIndianPhone("09876543210"), "+919876543210");
      assert.equal(normalizeIndianPhone(" 98765 43210 "), "+919876543210");
    });
  });

  describe("2, 3, 4. Invalid Indian mobile numbers", () => {
    it("rejects numbers starting with 1, 2, 3, 4, 5", () => {
      assert.equal(isValidIndianPhone("1234567890"), false);
      assert.equal(isValidIndianPhone("5123456789"), false);
      assert.throws(() => normalizeIndianPhone("1234567890"), /valid 10-digit Indian mobile number/);
      assert.throws(() => normalizeIndianPhone("5123456789"), /valid 10-digit Indian mobile number/);
    });

    it("rejects invalid lengths (less than 10 digits or more than 10 digits)", () => {
      assert.equal(isValidIndianPhone("987654321"), false);
      assert.equal(isValidIndianPhone("98765432101"), false);
      assert.throws(() => normalizeIndianPhone("987654321"), /valid 10-digit Indian mobile number/);
      assert.throws(() => normalizeIndianPhone("98765432101"), /valid 10-digit Indian mobile number/);
    });

    it("rejects letters, special characters, and empty values", () => {
      assert.equal(isValidIndianPhone("98765abcde"), false);
      assert.equal(isValidIndianPhone(""), false);
      assert.equal(isValidIndianPhone(null), false);
      assert.throws(() => normalizeIndianPhone("98765abcde"), /valid 10-digit Indian mobile number/);
      assert.throws(() => normalizeIndianPhone(""), /valid 10-digit Indian mobile number/);
      assert.throws(() => normalizeIndianPhone(null), /valid 10-digit Indian mobile number/);
    });
  });

  describe("e164ToDigits and extractDigits utilities", () => {
    it("converts +91 E.164 to bare 10-digit number", () => {
      assert.equal(e164ToDigits("+919876543210"), "9876543210");
    });

    it("extracts bare digits accurately", () => {
      assert.equal(extractDigits("+91 98765 43210"), "9876543210");
      assert.equal(extractDigits("09876543210"), "9876543210");
    });
  });
});
