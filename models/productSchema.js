const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter product name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please enter product description"],
  },
  price: {
    type: Number,
    required: [true, "Please enter product price"],
    maxLength: [7, "Price cannot exceed 7 digits"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  image: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [true, "Please enter product category"],
  },
  stock: {
    type: Number,
    required: [true, "Please enter product stock"],
    default: 1,
  },
  noOfReviews: {
    type: Number,
    default: 0,
  },
  review: [
    {
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],

  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);

// const mongoose = require("mongoose");

// const productSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, "Please enter product name"],
//     trim: true,
//   },

//   description: {
//     type: String,
//     required: [true, "Please enter product description"],
//   },

//   price: {
//     type: Number,
//     required: [true, "Please enter product price"],
//     maxLength: [7, "Price cannot exceed 7 digits"],
//   },

//   ratings: {
//     type: Number,
//     default: 0,
//   },

//   images: [
//     {
//       public_id: {
//         type: String,
//         required: [true, "Image public ID is required"],
//       },
//       url: {
//         type: String,
//         required: [true, "Image URL is required"],
//       },
//     },
//   ],

//   category: {
//     type: String,
//     required: [true, "Please enter product category"],
//   },

//   stock: {
//     type: Number,
//     required: [true, "Please enter product stock"],
//     default: 1,
//   },

//   noOfReviews: {
//     type: Number,
//     default: 0,
//   },

//   reviews: [
//     {
//       name: {
//         type: String,
//         required: [true, "Reviewer name is required"],
//       },
//       rating: {
//         type: Number,
//         required: [true, "Reviewer rating is required"],
//       },
//       comment: {
//         type: String,
//         required: [true, "Review comment is required"],
//       },
//       user: {
//         type: mongoose.Schema.ObjectId,
//         ref: "User",
//         required: true,
//       },
//     },
//   ],

//   user: {
//     type: mongoose.Schema.ObjectId,
//     ref: "User",
//     required: [true, "Product creator reference is required"],
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model("Product", productSchema);
