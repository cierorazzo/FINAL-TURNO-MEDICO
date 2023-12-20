const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongodbId = require("../utils/validateMongodbId");

const createProduct = asyncHandler(async (req, res) => {
  try {
    if (req.body.name) {
      req.body.slug = slugify(req.body.name);
    }
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
  } catch (error) {
    if (error.keyPattern.license) {
      res.status(400).json({ error: "La licencia debe ser única" });
    } else {
      res.status(500).json({ error: "Error al crear el médico, duplicado" });
    }
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  validateMongodbId(productId);
  try {
    if (req.body.name) {
      req.body.slug = slugify(req.body.name);
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      { _id: productId },
      req.body,
      {
        new: true,
      }
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: "Médico no encontrado" });
    }
    res.json(updateProduct);
  } catch (error) {
    throw new Error(error);
  }
});
const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  validateMongodbId(productId);
  try {
    const deletedProduct = await Product.findByIdAndDelete(
      { _id: productId },
      req.body,
      {
        new: true,
      }
    );
    if (!deletedProduct) {
      return res.status(404).json({ error: "Médico no encontrado" });
    }
    res.json(deletedProduct);
  } catch (error) {
    throw new Error(error);
  }
});
const getaProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const findProduct = await Product.findById(id);
    res.json(findProduct);
  } catch (error) {
    throw new Error(error);
  }
});
const getAllProduct = asyncHandler(async (req, res) => {
  try {
    // Filtrado
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    let query = Product.find(JSON.parse(queryStr));
    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }
    // Limitando los campos
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }
    // Paginacion
    const page = req.query.page;
    const limit = req.query.limit;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (req.query.page) {
      const productCount = await Product.countDocuments();
      if (skip >= productCount) throw new Error("Esta página no existe.");
    }
    console.log(page, limit, skip);
    const product = await query;
    res.json(product);
  } catch (error) {
    throw new Error(error);
  }
});
const addToWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { prodId, turns } = req.body;

  try {
    const user = await User.findById(_id);
    const added = user.wishlist.find((id) => id.toString() === prodId);

    if (added) {
      let updatedUser = await User.findByIdAndUpdate(
        _id,
        { $pull: { wishlist: prodId } },
        { new: true }
      );
      res.json(updatedUser);
    } else {
      let updatedUser = await User.findByIdAndUpdate(
        _id,
        { $push: { wishlist: prodId } },
        { new: true }
      );
      await Product.findByIdAndUpdate(
        prodId,
        {
          $set: {
            "turns.$[element].disponible": false,
          },
        },
        {
          arrayFilters: [
            {
              "element.date": { $in: turns.map((turn) => new Date(turn.date)) },
              "element.time": { $in: turns.map((turn) => turn.time) },
            },
          ],
          new: true,
        }
      );

      res.json(updatedUser);
    }
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getaProduct,
  getAllProduct,
  addToWishlist,
};
