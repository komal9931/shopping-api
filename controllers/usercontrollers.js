const User = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const ErrorHandler = require("../utils/ErrorHandler");
const sendEmail = require("../utils/sendemail");
const crypto = require("crypto");
// @desc    Register a new user
// @route   POST /api/v1/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      emailId,
      password,
      age,
      gender,
      photoUrl,
      about,
      role, // optional
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return next(new ErrorHandler("User already exists with this email", 400));
      // return res.status(400).json({
      //   success: false,
      //   message: "User already exists with this email",
      // });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
      age,
      gender,
      photoUrl,
      about,
      role,
    });

    // Generate JWT token using schema method
    const token = await user.getJWT();
    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
    });
    // Send response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        emailId: user.emailId,
        role: user.role,
      },
    });
  } catch (error) {
    // ✅ Handle Mongo duplicate key error
    if (error.code === 11000 && error.keyPattern?.emailId) {
      return next(new ErrorHandler("Email already registered", 400));
    }
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { emailId, password } = req.body;

    // 1. Check if email and password are entered
    if (!emailId || !password) {
      return next(new ErrorHandler("Please enter email and password", 400));
    }

    // 2. Find user by email
    const user = await User.findOne({ emailId });
    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    // 3. Compare password using bcrypt
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    // 4. Generate JWT token
    const token = await user.getJWT();

    // 5. Set token in cookie
    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000), // 8 hours
      httpOnly: true, // cookie can't be accessed by client-side scripts
    });

    // 6. Send successful response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        emailId: user.emailId,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  // res.cookie("token", null, {
  //   expires: new Date(Date.now()),
  // });
  // res.send("Logout Successful!!");
  try {
    res.cookie("token", null, {
      expires: new Date(Date.now()), // Immediately expire the cookie
      httpOnly: true, // Secure: cookie can’t be accessed by JS
      sameSite: "lax", // Helps with CSRF protection
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
    });

    res.status(200).json({
      success: true,
      message: "Logout successful!",
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { emailId } = req.body;
    // console.log(emailId);
    const user = await User.findOne({ emailId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Generate reset token and update user document
    const resetToken = await user.generatePasswordResetToken(); // or generatePasswordResetToken()
    await user.save({ validateBeforeSave: false });
    // console.log(resetToken);

    // Construct reset URL (for frontend password reset page)
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/password/reset/${resetToken}`;

    // TODO: Send resetUrl to user's email
    // Example: await sendEmail(user.email, "Password Reset", `Reset your password here: ${resetUrl}`);
    const message = `
    <p>You requested a password reset.</p>
    <p>Click the link below to reset your password. This link will expire in 15 minutes:</p>
    <a href="${resetUrl}" target="_blank">${resetUrl}</a>
    <p>If you didn't request this, please ignore this email.</p>
  `;

    await sendEmail(user.emailId, "Password Reset Request", message);

    return res.status(200).json({
      success: true,
      message:
        "Password reset link has been sent to your email. This link will expire in 15 minutes.",
      resetUrl, // optional for testing
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return next(
      new ErrorHandler(
        "Could not process password reset. Please try again later.",
        500
      )
    );
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const resetToken = req.params.token;
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Token is invalid or has expired" });
    }

    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return next(new ErrorHandler("Passwords do not match", 400));
    }

    // If you're not hashing in pre-save hook, hash manually here
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    // sendToken(user, 200, res);
    const token = await user.getJWT();
    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        emailId: user.emailId,
        role: user.role,
      },
    });
  } catch (err) {
    console.log("Reset Password Error:", err.message);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    // const user = req.user.id;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: err.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  getUserProfile,
};
