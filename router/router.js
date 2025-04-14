const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productlogic");
const { userAuth, authorizeRoles } = require("../middleware/auth");

router.post("/product", userAuth, authorizeRoles("admin"), createProduct);
router.get("/products", userAuth, getAllProducts);
router.put("/product/:id", authorizeRoles("admin"), updateProduct);
router.delete("/product/:id", authorizeRoles("admin"), deleteProduct);
router.get("/product/:id", getProductById);

module.exports = router;
