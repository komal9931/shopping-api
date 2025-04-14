const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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
      default: "https://geographyandyou.com/images/user-profile.png",
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

    // Role Field
    role: {
      type: String,
      enum: ["user", "admin", "trainer"],
      default: "user",
    },

    // Reset Password Support
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

userSchema.methods.getJWT = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.JWT_SECRET, // 🔐 From .env
    {
      expiresIn: process.env.JWT_EXPIRE || "7d", // optional
    }
  );
};

userSchema.methods.generatePasswordResetToken = function () {
  // Generate a random reset token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash and set to resetPasswordToken field in the user document
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token expiry time (e.g., 15 minutes from now)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  // Set token expiry time (e.g., 30 minutes from now)
  // this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  // Return the plain reset token (send this in email to user)
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
