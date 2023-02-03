const mongoose = require("mongoose");
const fileHelper = require("../util/file");
const cloudinary = require("../cloudinary");

const Product = require("../models/product");

const { validationResult } = require("express-validator");

exports.getAddProduct = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  res.render("admin/edit-product", {
    docTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const body = req.body;
  const { title, price, description } = body;
  const image = req.file;
  console.log("File Picker ", image);
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: "Attached file is not an image.",
      validationErrors: [],
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  const imageUrl = image.path;

  console.log("Uploaded image Path: ", imageUrl);

  cloudinary.uploader
    .upload(imageUrl)
    .then((result) => {
      const product = new Product({
        // _id: new mongoose.Types.ObjectId("63b184242a77d63ea7fba780"),
        title: title,
        price: price,
        description: description,
        imageUrl: result.secure_url,
        userId: req.user,
        cloudinary_id: result.public_id,
      });
      // console.log("before: ", result.public_id);
      product.save().then((result) => {
        // console.log("Result is: ", result);
        console.log("Created product!");
        // console.log("after: ", result.cloudinary_id);
        res.redirect("/admin/products");
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }

      res.render("admin/edit-product", {
        docTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = async (req, res, next) => {
  const { productId, title, price, description } = req.body;
  const image = req.file;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("admin/edit-product", {
      docTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
        _id: productId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  const product = await Product.findById(productId);

  if (product.userId.toString() !== req.user._id.toString()) {
    return res.redirect("/");
  }

  product.title = title;
  product.price = price;
  product.description = description;

  if (image) {
    await cloudinary.uploader.destroy(product.cloudinary_id);

    const result = await cloudinary.uploader.upload(image.path);

    product.imageUrl = result.secure_url;
    product.cloudinary_id = result.public_id;
  }

  await product.save();

  console.log("Updated Product Into DB");
  res.redirect("/admin/products");
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .populate("userId")
    .then((products) => {
      console.log("Admin Products: ", products);
      res.render("admin/products", {
        prods: products,
        docTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found."));
      }
      // fileHelper.deleteFile(product.imageUrl);
      // delete image from cloudinary
      cloudinary.uploader.destroy(product.cloudinary_id);
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then((result) => {
      console.log("Product Deleted", result);
      res.status(200).json({ message: "Success!" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Deleting product failed!" });
    });
};
