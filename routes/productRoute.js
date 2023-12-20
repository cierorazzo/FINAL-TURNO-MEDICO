const express = require("express");
const {
  createProduct,
  getaProduct,
  addToWishlist,
  cancelTurns,
  updateProduct,
  deleteProduct,
  getAllProduct,
} = require("../controller/productCtrl");
const {isAdmin, authMiddleware} = require("../middlewares/authMiddleware")
const router = express.Router();

router.post("/", authMiddleware, isAdmin, createProduct);
router.get("/:id", getaProduct);
router.put("/wishlist", authMiddleware, addToWishlist)
router.post("/cancelled-turn", authMiddleware, cancelTurns)
router.put("/:id",authMiddleware,  isAdmin, updateProduct);
router.delete("/:id",authMiddleware,  isAdmin, deleteProduct);
router.get("/:id", getaProduct);
router.get("/", getAllProduct);

module.exports = router;
