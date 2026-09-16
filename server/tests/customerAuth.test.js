import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import bcryptjs from "bcryptjs";
import { registerCustomer, loginCustomer, getCustomerProfile, updateCustomerProfile } from "../controllers/customerAuthController.js";
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

describe("Customer Authentication System (Mobile & Email Login)", () => {
  const validPhone = "9876543210";
  const formattedE164 = "+919876543210";
  const validEmail = "customer@example.com";
  const validPassword = "password123";

  beforeEach(() => {
    process.env.CUSTOMER_JWT_SECRET = "test_customer_jwt_secret_key_12345";
  });

  describe("Registration", () => {
    it("successfully creates an account with valid Indian mobile number and normalizes to E.164", async () => {
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
        const req = {
          body: {
            name: "Sneha Patel",
            phone: validPhone,
            email: validEmail,
            password: validPassword,
          },
        };
        const res = createMockRes();

        await registerCustomer(req, res);

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.customer.phone, formattedE164);
        assert.equal(res.body.data.customer.name, "Sneha Patel");
        assert.ok(res.body.data.token);
      } finally {
        Customer.findOne = origFindOne;
        Customer.create = origCreate;
      }
    });

    it("rejects registration with invalid Indian phone", async () => {
      const req = {
        body: {
          name: "Invalid User",
          phone: "1234567890",
          password: validPassword,
        },
      };
      const res = createMockRes();

      await registerCustomer(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /valid 10-digit Indian mobile number/);
    });

    it("rejects registration with duplicate phone", async () => {
      const origFindOne = Customer.findOne;
      Customer.findOne = async () => ({
        _id: "existing_cust_id",
        phone: formattedE164,
      });

      try {
        const req = {
          body: {
            name: "Duplicate User",
            phone: validPhone,
            password: validPassword,
          },
        };
        const res = createMockRes();

        await registerCustomer(req, res);

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /already exists/);
      } finally {
        Customer.findOne = origFindOne;
      }
    });

    it("hashes password properly with bcrypt", async () => {
      const salt = await bcryptjs.genSalt(10);
      const hash = await bcryptjs.hash(validPassword, salt);
      assert.equal(await bcryptjs.compare(validPassword, hash), true);
      assert.equal(await bcryptjs.compare("wrongPassword", hash), false);
    });
  });

  describe("Login (Mobile & Email)", () => {
    it("1. Login with valid 10-digit mobile number + password", async () => {
      const origFindOne = Customer.findOne;
      Customer.findOne = (query) => ({
        select: () => ({
          _id: "cust_12345",
          name: "Sneha Patel",
          phone: formattedE164,
          email: validEmail,
          isActive: true,
          matchPassword: async (p) => p === validPassword,
        }),
      });

      try {
        const req = {
          body: {
            identifier: validPhone,
            password: validPassword,
          },
        };
        const res = createMockRes();

        await loginCustomer(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.customer.name, "Sneha Patel");
        assert.equal(res.body.data.customer.phone, formattedE164);
        assert.ok(res.body.data.token);
      } finally {
        Customer.findOne = origFindOne;
      }
    });

    it("2. Login with +91 mobile number + password", async () => {
      const origFindOne = Customer.findOne;
      Customer.findOne = (query) => ({
        select: () => ({
          _id: "cust_12345",
          name: "Sneha Patel",
          phone: formattedE164,
          isActive: true,
          matchPassword: async (p) => p === validPassword,
        }),
      });

      try {
        const req = {
          body: {
            identifier: formattedE164,
            password: validPassword,
          },
        };
        const res = createMockRes();

        await loginCustomer(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.data.token);
      } finally {
        Customer.findOne = origFindOne;
      }
    });

    it("3. Login with valid email + password", async () => {
      const origFindOne = Customer.findOne;
      let searchedQuery = null;

      Customer.findOne = (query) => {
        searchedQuery = query;
        return {
          select: () => ({
            _id: "cust_12345",
            name: "Sneha Patel",
            phone: formattedE164,
            email: validEmail,
            isActive: true,
            matchPassword: async (p) => p === validPassword,
          }),
        };
      };

      try {
        const req = {
          body: {
            identifier: validEmail,
            password: validPassword,
          },
        };
        const res = createMockRes();

        await loginCustomer(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(searchedQuery.email, validEmail.toLowerCase());
        assert.equal(res.body.data.customer.email, validEmail);
        assert.ok(res.body.data.token);
      } finally {
        Customer.findOne = origFindOne;
      }
    });

    it("4. Login with non-existent / invalid email + password", async () => {
      const origFindOne = Customer.findOne;
      Customer.findOne = () => ({
        select: () => null,
      });

      try {
        const req = {
          body: {
            identifier: "nonexistent@example.com",
            password: validPassword,
          },
        };
        const res = createMockRes();

        await loginCustomer(req, res);

        assert.equal(res.statusCode, 401);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /Invalid email\/mobile number or password/);
      } finally {
        Customer.findOne = origFindOne;
      }
    });

    it("5. Login with non-existent / invalid mobile + password", async () => {
      const origFindOne = Customer.findOne;
      Customer.findOne = () => ({
        select: () => null,
      });

      try {
        const req = {
          body: {
            identifier: "9999999999",
            password: validPassword,
          },
        };
        const res = createMockRes();

        await loginCustomer(req, res);

        assert.equal(res.statusCode, 401);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /Invalid email\/mobile number or password/);
      } finally {
        Customer.findOne = origFindOne;
      }
    });

    it("6. Login with wrong password", async () => {
      const origFindOne = Customer.findOne;
      Customer.findOne = () => ({
        select: () => ({
          _id: "cust_12345",
          phone: formattedE164,
          email: validEmail,
          isActive: true,
          matchPassword: async () => false,
        }),
      });

      try {
        const req = {
          body: {
            identifier: validEmail,
            password: "wrongPassword",
          },
        };
        const res = createMockRes();

        await loginCustomer(req, res);

        assert.equal(res.statusCode, 401);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /Invalid email\/mobile number or password/);
      } finally {
        Customer.findOne = origFindOne;
      }
    });

    it("7. Missing identifier", async () => {
      const req = {
        body: {
          password: validPassword,
        },
      };
      const res = createMockRes();

      await loginCustomer(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Email or mobile number is required/);
    });

    it("8. Missing password", async () => {
      const req = {
        body: {
          identifier: validPhone,
        },
      };
      const res = createMockRes();

      await loginCustomer(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Password is required/);
    });

    it("9. Existing customer with no email can still login with phone", async () => {
      const origFindOne = Customer.findOne;
      Customer.findOne = () => ({
        select: () => ({
          _id: "cust_no_email",
          name: "Phone Only Customer",
          phone: formattedE164,
          email: undefined,
          isActive: true,
          matchPassword: async (p) => p === validPassword,
        }),
      });

      try {
        const req = {
          body: {
            identifier: validPhone,
            password: validPassword,
          },
        };
        const res = createMockRes();

        await loginCustomer(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.customer.name, "Phone Only Customer");
      } finally {
        Customer.findOne = origFindOne;
      }
    });

    it("10. Existing customer with email can login with email", async () => {
      const origFindOne = Customer.findOne;
      Customer.findOne = () => ({
        select: () => ({
          _id: "cust_with_email",
          name: "Email Customer",
          phone: formattedE164,
          email: "customerexisting@test.com",
          isActive: true,
          matchPassword: async (p) => p === validPassword,
        }),
      });

      try {
        const req = {
          body: {
            identifier: "customerexisting@test.com",
            password: validPassword,
          },
        };
        const res = createMockRes();

        await loginCustomer(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.customer.name, "Email Customer");
      } finally {
        Customer.findOne = origFindOne;
      }
    });

    it("11. Google login remains unaffected and profile retrieval works", async () => {
      const req = {
        customer: {
          _id: "cust_google_user",
          name: "Google Customer",
          phone: formattedE164,
          email: "googleuser@gmail.com",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      const res = createMockRes();

      await getCustomerProfile(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, "Google Customer");
      assert.equal(res.body.data.email, "googleuser@gmail.com");
    });
  });

  describe("Profile Update (Edit Customer Profile)", () => {
    it("1. Successfully updates name and email for authenticated customer", async () => {
      const origFindByIdAndUpdate = Customer.findByIdAndUpdate;
      const origFindOne = Customer.findOne;

      Customer.findOne = async () => null; // No duplicate email
      Customer.findByIdAndUpdate = async (id, update) => ({
        _id: id,
        name: update.$set.name,
        phone: formattedE164,
        email: update.$set.email,
        phoneVerified: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      try {
        const req = {
          customer: { _id: "cust_12345" },
          body: {
            name: "Sneha Sharma",
            email: "sneha.updated@example.com",
          },
        };
        const res = createMockRes();

        await updateCustomerProfile(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.name, "Sneha Sharma");
        assert.equal(res.body.data.email, "sneha.updated@example.com");
        assert.equal(res.body.data.phone, formattedE164);
      } finally {
        Customer.findByIdAndUpdate = origFindByIdAndUpdate;
        Customer.findOne = origFindOne;
      }
    });

    it("2. Rejects update with empty name", async () => {
      const req = {
        customer: { _id: "cust_12345" },
        body: {
          name: "   ",
        },
      };
      const res = createMockRes();

      await updateCustomerProfile(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Name cannot be empty/);
    });

    it("3. Rejects update with invalid email format", async () => {
      const req = {
        customer: { _id: "cust_12345" },
        body: {
          name: "Sneha Patel",
          email: "invalid-email-format",
        },
      };
      const res = createMockRes();

      await updateCustomerProfile(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Invalid email format/);
    });

    it("4. Rejects update when email is taken by another customer", async () => {
      const origFindOne = Customer.findOne;
      Customer.findOne = async () => ({
        _id: "other_customer_id",
        email: "taken@example.com",
      });

      try {
        const req = {
          customer: { _id: "cust_12345" },
          body: {
            name: "Sneha Patel",
            email: "taken@example.com",
          },
        };
        const res = createMockRes();

        await updateCustomerProfile(req, res);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /already exists/);
      } finally {
        Customer.findOne = origFindOne;
      }
    });

    it("5. Rejects unauthorized request without customer", async () => {
      const req = {
        customer: null,
        body: { name: "Sneha" },
      };
      const res = createMockRes();

      await updateCustomerProfile(req, res);

      assert.equal(res.statusCode, 401);
      assert.equal(res.body.success, false);
    });
  });
});
