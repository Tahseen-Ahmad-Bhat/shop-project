const path = require("path");

const express = require("express");
const { body } = require("express-validator/check");

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  [
    body("title", "Title should be string of length greater than 2!")
      .isString()
      .trim()
      .isLength({ min: 3 }),

    body("price", "Please submit the price of the Product!").isNumeric(),
    body("description", "Please give the description of your Product")
      .trim()
      .isLength({ min: 5 }),
  ],

  isAuth,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  [
    body("title", "Title should be string of length greater than 2!")
      .isString()
      .trim()
      .isLength({ min: 3 }),

    body("price", "Please submit the price of the Product!").isNumeric(),
    body("description", "Please give the description of your Product")
      .trim()
      .isLength({ min: 5 }),
  ],
  isAuth,
  adminController.postEditProduct
);

router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
