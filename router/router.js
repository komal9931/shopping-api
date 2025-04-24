const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAdminAllProducts,
  reviewforproduct,
} = require("../controllers/productlogic");
const { userAuth, authorizeRoles } = require("../middleware/auth");

router.get("/products", getAllProducts);

router.get("/admin/products",userAuth,authorizeRoles("admin"),getAdminAllProducts)
router.post("/admin/product", userAuth, authorizeRoles("admin"), createProduct);
router.put("/admin/product/:id", userAuth, authorizeRoles("admin"), updateProduct);
router.delete("/admin/product/:id", userAuth, authorizeRoles("admin"), deleteProduct);

router.get("/product/:id", getProductById);

router.put("/product/review",userAuth, reviewforproduct);

module.exports = router;
