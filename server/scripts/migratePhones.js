import dotenv from "dotenv";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import { normalizeIndianPhone } from "../utils/phoneUtils.js";

dotenv.config();

const isDryRun = process.argv.includes("--dry-run");

async function migrate() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGO_URI not found in environment.");
      process.exit(1);
    }

    console.log(`Connecting to MongoDB... (Mode: ${isDryRun ? "DRY RUN" : "LIVE MIGRATION"})`);
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    const customers = await Customer.find({});
    console.log(`Found ${customers.length} customer records.`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const customer of customers) {
      try {
        const rawPhone = customer.phone;
        const normalized = normalizeIndianPhone(rawPhone);

        const needsPhoneUpdate = customer.phone !== normalized;
        const needsVerifiedFlag = customer.phoneVerified === undefined;

        if (needsPhoneUpdate || needsVerifiedFlag) {
          console.log(
            `Customer ${customer._id} (${customer.name}): phone '${customer.phone}' -> '${normalized}', phoneVerified: ${customer.phoneVerified ?? false}`
          );

          if (!isDryRun) {
            customer.phone = normalized;
            if (customer.phoneVerified === undefined) {
              customer.phoneVerified = false;
            }
            await customer.save({ validateBeforeSave: false });
          }
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`Error processing customer ${customer._id}: ${err.message}`);
        errorCount++;
      }
    }

    console.log("\nMigration Summary:");
    console.log(`- Total: ${customers.length}`);
    console.log(`- Updated: ${updatedCount} ${isDryRun ? "(simulated)" : ""}`);
    console.log(`- Skipped (already valid): ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);

    await mongoose.disconnect();
    console.log("Database disconnected.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
