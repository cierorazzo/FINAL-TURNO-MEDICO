const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    license:{
      type: String,
      required:true,
      unique: true,
    },
    turns: [
      {
        date: {
          type: Date,
          required: true,
        },
        time: {
          type: String,
          required: true,
        },
        disponible: {
          type: Boolean,
          default: true,
          required:false,
        },
        postedby: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "User" 
        },
      },
    ],
    ratings: [
      {
        star: Number,
        postedby: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

//Export the model
module.exports = mongoose.model("Product", productSchema);
