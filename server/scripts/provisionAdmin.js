import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";
import mongoose from "mongoose";
import {
  sanitizeEnvString,
  maskEmail,
  findAdminByEmail,
  parseBooleanEnv,
} from "../utils/provisionAdmin.js";

dotenv.config();

const provision = async () => {
  try {
    const rawEmail = process.env.ADMIN_EMAIL;
    const rawPassword = process.env.ADMIN_PASSWORD;
    const rawName = process.env.ADMIN_NAME;
    const rawForceSync = process.env.ADMIN_FORCE_SYNC;

    const email = sanitizeEnvString(rawEmail).toLowerCase();
    const password = sanitizeEnvString(rawPassword);
    const name = sanitizeEnvString(rawName) || "Sneha Bazar Admin";
    const forceSync = parseBooleanEnv(rawForceSync);

    if (!email || !password) {
      console.error(
        "Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required."
      );
      console.error(
        "Example: ADMIN_EMAIL=admin@snehabazar.in ADMIN_PASSWORD=your_password node scripts/provisionAdmin.js"
      );
      process.exit(1);
    }

    if (password.length < 6) {
      console.error("Error: ADMIN_PASSWORD must be at least 6 characters long.");
      process.exit(1);
    }

    await connectDB();

    const existingAdmin = await findAdminByEmail(email);
    const masked = maskEmail(email);

    if (existingAdmin) {
      existingAdmin.name = name;
      existingAdmin.password = password; // Hashed by pre-save hook
      await existingAdmin.save();
      console.log(`[Admin CLI] Admin account credentials updated for: ${masked}`);
    } else {
      await Admin.create({
        name,
        email,
        password,
      });
      console.log(`[Admin CLI] Admin account provisioned successfully for: ${masked}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("[Admin CLI] Provisioning failed:", error.message);
    process.exit(1);
  }
};

provision();
