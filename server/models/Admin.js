import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Security: never return password by default in queries
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  // Prevent double-hashing if password is already a valid bcrypt hash
  if (
    typeof this.password === "string" &&
    /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(this.password)
  ) {
    return;
  }

  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
});

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) {
    return false;
  }
  return await bcryptjs.compare(candidatePassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
