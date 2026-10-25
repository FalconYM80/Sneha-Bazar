import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";
import mongoose from "mongoose";

dotenv.config();

const provision = async () => {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD?.trim();
    const name = process.env.ADMIN_NAME?.trim() || "Sneha Bazar Admin";

    if (!email || !password) {
      console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
      console.error("Example: ADMIN_EMAIL=admin@snehabazar.in ADMIN_PASSWORD=your_password node scripts/provisionAdmin.js");
      process.exit(1);
    }

    if (password.length < 6) {
      console.error("Error: ADMIN_PASSWORD must be at least 6 characters.");
      process.exit(1);
    }

    await connectDB();

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      existingAdmin.name = name;
      existingAdmin.password = password; // Hashed by pre-save hook
      await existingAdmin.save();
      console.log(`Admin account updated successfully for: ${email}`);
    } else {
      await Admin.create({
        name,
        email,
        password,
      });
      console.log(`Admin account provisioned successfully for: ${email}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Provisioning failed:", error.message);
    process.exit(1);
  }
};

provision();
