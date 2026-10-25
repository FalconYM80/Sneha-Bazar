import Admin from "../models/Admin.js";

/**
 * Ensures an admin account exists based on environment variables.
 * Initial admin credentials can be configured securely in Render environment variables:
 * - ADMIN_EMAIL
 * - ADMIN_PASSWORD
 * - ADMIN_NAME (optional, defaults to "Sneha Bazar Admin")
 * - ADMIN_FORCE_SYNC (optional "true" to update existing admin's password/name)
 *
 * Passwords are automatically hashed with bcrypt via Admin pre-save hook.
 * Never logs plaintext passwords or sensitive secrets.
 */
export const ensureAdminAccount = async () => {
  try {
    const rawEmail = process.env.ADMIN_EMAIL;
    const rawPassword = process.env.ADMIN_PASSWORD;
    const rawName = process.env.ADMIN_NAME;
    const forceSync = process.env.ADMIN_FORCE_SYNC === "true";

    if (!rawEmail || !rawPassword) {
      return;
    }

    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword.trim();
    const name = rawName?.trim() || "Sneha Bazar Admin";

    if (password.length < 6) {
      console.warn("[Admin Provisioning] ADMIN_PASSWORD must be at least 6 characters long.");
      return;
    }

    const existingAdmin = await Admin.findOne({ email });

    if (!existingAdmin) {
      await Admin.create({
        name,
        email,
        password,
      });
      console.log(`[Admin Provisioning] Admin account created for: ${email}`);
    } else if (forceSync) {
      existingAdmin.name = name;
      existingAdmin.password = password;
      await existingAdmin.save();
      console.log(`[Admin Provisioning] Admin credentials updated for: ${email}`);
    }
  } catch (error) {
    console.error("[Admin Provisioning] Error during admin verification:", error.message);
  }
};
