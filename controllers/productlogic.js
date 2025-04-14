// const Product = require("../models/productSchema");
// const ErrorHandler = require("../utils/ErrorHandler");

// const createProduct = async (req, res) => {
//   try {
//     const { name, description, price, category, stock, image } = req.body;

//     const product = await Product.create({
//       name,
//       description,
//       price,
//       category,
//       stock,
//       image,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Product created successfully",
//       product,
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// const getAllProducts = async (req, res) => {
//   try {
//     const products = await Product.find();
//     res.status(200).json({
//       success: true,
//       products,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// const updateProduct = async (req, res) => {
//   try {
//     let product = await Product.findById(req.params.id);

//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }

//     product = await Product.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({
//       success: true,
//       message: "Product updated successfully",
//       product,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// const deleteProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);

//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }

//     await product.deleteOne();

//     res.status(200).json({
//       success: true,
//       message: "Product deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// const getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);

//     if (!product) {
//       return next(new ErrorHandler("Product not found", 404));
//     }

//     // if (!product) {
//     //   return res.status(404).json({
//     //     success: false,
//     //     message: "Product not found",
//     //   });
//     // }

//     res.status(200).json({
//       success: true,
//       product,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// module.exports = {
//   createProduct,
//   getAllProducts,
//   updateProduct,
//   deleteProduct,
//   getProductById,
// };
const Product = require("../models/productSchema");
const ApiFeatures = require("../utils/apiFeatures");
const ErrorHandler = require("../utils/ErrorHandler");

// ✅ CREATE Product
const createProduct = async (req, res, next) => {
  // req.body.user = req.user.id;
  console.log(req.user);
  try {
    const { name, description, price, category, stock, image } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      image,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ GET All Products
// const getAllProducts = async (req, res, next) => {
//   // console.log(req.query);
//   const resultPerPage = 3;
//   try {
//     const apiFeatures = new ApiFeatures(Product.find(), req.query)
//       .search()
//       .filter()
//       .pagination(resultPerPage);
//     const products = await apiFeatures.query;
//     // const products = await Product.find();
//     res.status(200).json({
//       success: true,
//       resultPerPage,
//       count: products.length,
//       products,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const getAllProducts = async (req, res, next) => {
//   try {
//     const resultPerPage = Number(req.query.limit) || 3;
//     const totalProducts = await Product.countDocuments();

//     const apiFeatures = new ApiFeatures(Product.find(), req.query)
//       .search()
//       .filter()
//       .pagination(resultPerPage);

//     const products = await apiFeatures.query;

//     const currentPage = Number(req.query.page) || 1;
//     const totalPages = Math.ceil(totalProducts / resultPerPage);

//     if (products.length === 0) {
//       return next(new ErrorHandler("No products found in this page", 404));
//     }
//     res.status(200).json({
//       success: true,
//       totalProducts,
//       resultPerPage,
//       currentPage,
//       totalPages,
//       count: products.length,
//       products,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const getAllProducts = async (req, res, next) => {
//   try {
//     const resultPerPage = Number(req.query.limit) || 3;

//     // Apply search & filter to count matching products
//     const filteredQuery = new ApiFeatures(Product.find(), req.query)
//       .search()
//       .filter();

//     const filteredProducts = await filteredQuery.query;
//     const totalProducts = filteredProducts.length;

//     // Apply pagination after getting count
//     const apiFeatures = new ApiFeatures(Product.find(), req.query)
//       .search()
//       .filter()
//       .pagination(resultPerPage);

//     const products = await apiFeatures.query;

//     const currentPage = Number(req.query.page) || 1;
//     const totalPages = Math.ceil(totalProducts / resultPerPage);

//     if (products.length === 0) {
//       return next(new ErrorHandler("No products found", 404));
//     }

//     res.status(200).json({
//       success: true,
//       totalProducts, // filtered count
//       resultPerPage,
//       currentPage,
//       totalPages,
//       count: products.length,
//       products,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

const getAllProducts = async (req, res, next) => {
  try {
    // Set how many products to return per page (default 3)
    const resultPerPage = Number(req.query.limit) || 3;

    // Step 1: Apply search and filter to get the total number of matched products
    const filteredQuery = new ApiFeatures(Product.find(), req.query)
      .search()
      .filter();

    const filteredProducts = await filteredQuery.query;
    const totalProducts = filteredProducts.length;

    // Step 2: Apply search, filter, and pagination to get paginated data
    const apiFeatures = new ApiFeatures(Product.find(), req.query)
      .search()
      .filter()
      .pagination(resultPerPage);

    const products = await apiFeatures.query;

    // Calculate pagination metadata
    const currentPage = Number(req.query.page) || 1;
    const totalPages = Math.ceil(totalProducts / resultPerPage);

    // If no products are found, throw an error
    if (products.length === 0) {
      return next(new ErrorHandler("No products found", 404));
    }

    // Send success response
    res.status(200).json({
      success: true,
      totalProducts, // Total number of matched (filtered) products
      resultPerPage, // How many results per page
      currentPage, // Current page number
      totalPages, // Total pages based on filtered results
      count: products.length, // Number of items returned on this page
      products, // The actual product data
    });
  } catch (error) {
    next(error); // Pass error to global error handler
  }
};
// ✅ GET Product By ID
const getProductById = async (req, res, next) => {
  // console.log(req.params.id);
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE Product
const updateProduct = async (req, res, next) => {
  try {
    // let product = await Product.findById(req.params.id);

    let product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ DELETE Product
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  getProductById,
};
