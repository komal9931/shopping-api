const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  getUserProfile,
} = require("../controllers/usercontrollers");
const { userAuth } = require("../middleware/auth");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);

router.post("/password/forgot", forgotPassword);
router.post("/password/reset/:token", resetPassword);

router.post("/profile", userAuth, getUserProfile);

module.exports = router;
