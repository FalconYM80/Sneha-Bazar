import Admin from "../models/Admin.js";

/**
 * Clean environment string by trimming whitespace and removing surrounding single/double quotes.
 */
export const sanitizeEnvString = (val) => {
  if (!val || typeof val !== "string") return "";
  let clean = val.trim();
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
};

/**
 * Mask an email address for safe diagnostic logging (e.g. ad***n@snehabazar.in).
 * Never exposes full email if sensitive, and never logs passwords.
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== "string") return "[unknown]";
  const clean = sanitizeEnvString(email);
  const parts = clean.split("@");
  if (parts.length !== 2) return "[invalid email format]";
  const [name, domain] = parts;
  const maskedName =
    name.length <= 2 ? `${name[0]}*` : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${maskedName}@${domain}`;
};

/**
 * Parse boolean environment variable like "true", "1", "yes".
 */
export const parseBooleanEnv = (val) => {
  if (!val) return false;
  const clean = sanitizeEnvString(String(val)).toLowerCase();
  return clean === "true" || clean === "1" || clean === "yes";
};

/**
 * Case-insensitive, whitespace-tolerant lookup for admin by email.
 */
export const findAdminByEmail = async (email) => {
  if (!email || typeof email !== "string") return null;
  const clean = sanitizeEnvString(email).toLowerCase();
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return await Admin.findOne({
    $or: [
      { email: clean },
      { email: new RegExp(`^\\s*${escaped}\\s*$`, "i") },
    ],
  });
};

/**
 * Ensures an admin account exists based on environment variables.
 * Initial admin credentials can be configured securely in Render environment variables:
 * - ADMIN_EMAIL
 * - ADMIN_PASSWORD
 * - ADMIN_NAME (optional, defaults to "Sneha Bazar Admin")
 * - ADMIN_FORCE_SYNC (optional "true" to update existing admin's password/name)
 *
 * Passwords are automatically hashed with bcrypt via Admin pre-save hook.
 * Never logs plaintext passwords, password hashes, JWTs, or other sensitive secrets.
 */
export const ensureAdminAccount = async () => {
  try {
    const rawEmail = process.env.ADMIN_EMAIL;
    const rawPassword = process.env.ADMIN_PASSWORD;
    const rawName = process.env.ADMIN_NAME;
    const rawForceSync = process.env.ADMIN_FORCE_SYNC;

    const emailPresent = Boolean(rawEmail && rawEmail.trim().length > 0);
    const passwordPresent = Boolean(rawPassword && rawPassword.trim().length > 0);
    const forceSync = parseBooleanEnv(rawForceSync);

    console.log(
      `[Admin Provisioning] Configuration diagnostics: ADMIN_EMAIL configured=${emailPresent}, ADMIN_PASSWORD configured=${passwordPresent}, ADMIN_FORCE_SYNC=${forceSync}`
    );

    if (!emailPresent || !passwordPresent) {
      console.log(
        "[Admin Provisioning] Automatic provisioning skipped: ADMIN_EMAIL or ADMIN_PASSWORD is missing in environment variables."
      );
      return;
    }

    const email = sanitizeEnvString(rawEmail).toLowerCase();
    const password = sanitizeEnvString(rawPassword);
    const name = sanitizeEnvString(rawName) || "Sneha Bazar Admin";
    const masked = maskEmail(email);

    if (password.length < 6) {
      console.warn(
        `[Admin Provisioning] ADMIN_PASSWORD for ${masked} must be at least 6 characters long (current length: ${password.length}). Provisioning skipped.`
      );
      return;
    }

    const totalAdmins = await Admin.countDocuments();
    const existingAdmin = await findAdminByEmail(email);

    if (!existingAdmin) {
      await Admin.create({
        name,
        email,
        password,
      });
      console.log(
        `[Admin Provisioning] Success: Initial admin account created for ${masked}. (Total admins: ${totalAdmins + 1})`
      );
    } else if (forceSync) {
      existingAdmin.name = name;
      existingAdmin.password = password; // Hashed by pre-save hook
      await existingAdmin.save();
      console.log(
        `[Admin Provisioning] Success: ADMIN_FORCE_SYNC is enabled. Admin credentials updated for ${masked}.`
      );
    } else {
      console.log(
        `[Admin Provisioning] Notice: Admin account already exists for ${masked}. Existing credentials preserved. (Set ADMIN_FORCE_SYNC=true in Render environment if you wish to update this account's password with ADMIN_PASSWORD).`
      );
    }
  } catch (error) {
    console.error("[Admin Provisioning] Error during admin verification:", error.message);
  }
};
