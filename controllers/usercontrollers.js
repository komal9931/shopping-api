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
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      emailId,
      // password: hashedPassword,
      password,
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

    // 1. Validate required fields
    if (!emailId || !password) {
      return next(new ErrorHandler("Please enter email and password", 400));
    }

    // 2. Find user by email
    // const user = await User.findOne({ emailId });

    // 2. Find user by email and include password
    const user = await User.findOne({ emailId }).select("+password");
    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    // 3. Compare password using bcrypt
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }
    // console.log("Entered password:", password);
    // console.log("Hashed password in DB:", user.password);

    // 4. Generate JWT token
    const token = await user.getJWT();

    // 5. Define secure cookie options
    // const cookieOptions = {
    //   expires: new Date(Date.now() + 8 * 3600000), // 8 hours
    //   httpOnly: true, // Not accessible via client-side JS
    //   sameSite: "lax", // CSRF protection
    //   secure: process.env.NODE_ENV === "production", // Send only over HTTPS in production
    // };

    // 6. Set JWT token in cookie
    // res.cookie("token", token, cookieOptions);

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

      // expires: new Date(0), // Ensures cookie is considered expired by all clients
      // httpOnly: true,       // Prevents client-side JavaScript from accessing the cookie
      // secure: process.env.NODE_ENV === "production", // Sends cookie over HTTPS only in production
      // sameSite: "strict",   // Strong CSRF protection
      // path: "/",            // Ensure cookie is removed for all routes
    });

    // Also clear cookie explicitly using res.clearCookie for added reliability
    //  res.clearCookie("token", {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "strict",
    //   path: "/",
    // });

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

const updatePassword = async (req, res, next) => {
  try {
    const { oldpassword, newpassword, confirmpassword } = req.body;

    // 1. Validate inputs
    if (!oldpassword || !newpassword || !confirmpassword) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    // 2. Find the user (must be authenticated)
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // 3. Check if old password matches
    const isMatch = await bcrypt.compare(oldpassword, user.password);
    if (!isMatch) {
      return next(new ErrorHandler("Old password is incorrect", 400));
    }

    // 4. Match new password and confirm password
    if (newpassword !== confirmpassword) {
      return next(
        new ErrorHandler("New password and confirm password do not match", 400)
      );
    }

    // 5. Update and hash the new password (hashing is handled in pre-save hook)
    user.password = newpassword;
    console.log("New password before save:", user.password);
    await user.save();
    console.log("New password after save:", user.password);

    // 6. Generate a new JWT token
    const token = await user.getJWT();

    // 7. Set token in cookie
    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000), // 8 hours
      httpOnly: true,
    });

    // 8. Return success with token and user info
    res.status(200).json({
      success: true,
      message: "Password updated and user logged in successfully",
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

const updateProfileData = async (req, res, next) => {
  try {
    const { firstName, lastName, emailId } = req.body;

    // 1. Validate presence of at least one field
    if (!firstName && !lastName && !emailId) {
      return next(new ErrorHandler("No data provided to update", 400));
    }

    // const updateUserDetails = {
    //   firstName,
    //   lastName,
    //   emailId,
    // };
    // const user = await User.findByIdAndUpdate(req.user.id, updateUserDetails, {
    //   new: true,
    //   runValidators: true,
    // });

    // 2. Prepare updated fields
    const updateUserDetails = {};
    if (firstName) updateUserDetails.firstName = firstName;
    if (lastName) updateUserDetails.lastName = lastName;
    if (emailId) updateUserDetails.emailId = emailId;

    // 3. Update user with validation
    const user = await User.findByIdAndUpdate(req.user.id, updateUserDetails, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // 4. Send response
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// TODO  ADMIN

// admin getting all the user
const getUserList = async (req, res, next) => {
  try {
    const userlist = await User.find();
    res.status(200).json({
      success: true,
      userlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// admin get single user data
const getsingleuserwithID = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        // message: "User not found",
        message: `User not found with ID: ${userId}`,
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// admin can change the role only
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    const newUserRoleData = {
      role,
    };

    // const user = await User.findByIdAndUpdate(req.user.id, newUserRoleData, {
    //   new: true,
    //   runValidators: true,
    // });
    const user = await User.findByIdAndUpdate(req.params.id, newUserRoleData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found with ID: ${req.user.id}`,
      });
    }
    // Update the role
    // user.role = role;
    // await user.save(); // Save the updated user to the database

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user role",
    });
  }
};

//admin can delete the user
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found with ID: ${req.params.id}`,
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
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
  updatePassword,
  updateProfileData,

  // admin
  getUserList,
  getsingleuserwithID,
  updateUserRole,
  deleteUser,
};
