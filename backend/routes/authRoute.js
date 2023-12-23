const express = require("express");
const router = express.Router();
const { createUser, loginUserCtrl, getallUser, getaUser, deleteaUser, updatedUser, handleRefreshToken, logout, updatePassword, forgotPassword, resetPassword} = require("../controller/userCtrl")
const { authMiddleware, isAdmin} = require("../middlewares/authMiddleware")

router.post("/register", createUser);
router.post("/login", loginUserCtrl);
router.get("/all-users", getallUser);
router.get("/refresh", handleRefreshToken);
router.get("/logout", logout )
router.get("/:id", authMiddleware, isAdmin, getaUser);
router.delete("/:id", deleteaUser);
router.put("/edit-user", authMiddleware, updatedUser);
router.put("/password", authMiddleware, updatePassword)
router.post("/password-forgot", forgotPassword);
router.put("/reset-password/:token", resetPassword);
module.exports = router;
