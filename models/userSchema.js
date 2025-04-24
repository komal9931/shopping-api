const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Personal Info
    firstName: {
      type: String,
      required: [true, "First name is required"],
      minLength: [4, "First name must be at least 4 characters"],
      maxLength: [50, "First name must not exceed 50 characters"],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },

    // Contact Info
    emailId: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: (props) => `Invalid email address: ${props.value}`,
      },
    },

    // Authentication
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      validate: {
        validator: (value) => validator.isStrongPassword(value),
        message: (props) => `Enter a strong password: ${props.value}`,
      },
    },

    // Profile Info
    age: {
      type: Number,
      min: [18, "Minimum age should be 18"],
    },

    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: `{VALUE} is not a valid gender type`,
      },
    },

    photoUrl: {
      type: String,
    
      validate: {
        validator: (value) => validator.isURL(value),
        message: (props) => `Invalid photo URL: ${props.value}`,
      },
    },

    about: {
      type: String,
      default: "This is a default about of the user!",
      trim: true,
    },

    role: {
      type: String,
      enum: ["user", "admin", "trainer"],
      default: "user",
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// ✅ FIXED: Enable password hashing before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.getJWT = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
