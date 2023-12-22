const express = require("express");
const router = express.Router();
const { createUser, loginUserCtrl, loginAdmin, getallUser, getaUser, deleteaUser, updatedUser, handleRefreshToken, logout} = require("../controller/userCtrl")
const { authMiddleware, isAdmin} = require("../middlewares/authMiddleware")

router.post("/register", createUser);
router.post("/login", loginUserCtrl);
router.post("/admin-login", loginAdmin)
router.get("/all-users", getallUser);
router.get("/refresh", handleRefreshToken);
router.get("/logout", logout )
router.get("/:id", authMiddleware, isAdmin, getaUser);
router.delete("/:id", deleteaUser);
router.put("/edit-user", authMiddleware, updatedUser);

module.exports = router;
