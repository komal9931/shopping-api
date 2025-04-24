const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updatePassword,
  updateProfileData,
  getUserList,
  getsingleuserwithID,
  updateUserRole,
  deleteUser,
} = require("../controllers/usercontrollers");
const { userAuth, authorizeRoles } = require("../middleware/auth");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);

router.post("/password/forgot", forgotPassword);
router.post("/password/reset/:token", resetPassword);

router.post("/profile", userAuth, getUserProfile);

router.post("/password/profile/update", userAuth, updatePassword);

router.post("/upateprofileData/update", userAuth, updateProfileData);

router.get("/admin/getuserslist",userAuth,authorizeRoles("admin"),getUserList)
router.get("/admin/single/:id",userAuth,authorizeRoles("admin"),getsingleuserwithID)
router.put("/admin/changerole/:id",userAuth,authorizeRoles("admin"),updateUserRole)
router.delete("/admin/deleteuser/:id",userAuth,authorizeRoles("admin"),deleteUser)

module.exports = router;
