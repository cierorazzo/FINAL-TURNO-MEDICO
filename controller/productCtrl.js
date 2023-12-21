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
    const existingProduct = await Product.findOne({
      license: req.body.license,
    });

    if (existingProduct) {
      return res.status(400).json({ error: "La licencia debe ser única" });
    }
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el médico" });
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
    const added =
      user.wishlist &&
      user.wishlist.find((item) => item.prodId.toString() === prodId);
    const product = await Product.findById(prodId);

    const areAllTurnsAvailable = turns.every((turn) => {
      const matchingTurn = product.turns.find(
        (t) => t._id.toString() === turn.id && t.disponible
      );

      return matchingTurn;
    });

    if (areAllTurnsAvailable) {
      if (added) {
        let updatedUser = await User.findByIdAndUpdate(
          _id,
          {
            $push: {
              "wishlist.$[item].turns": { $each: turns.map((turn) => turn.id) },
            },
          },
          { arrayFilters: [{ "item.prodId": prodId }], new: true }
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
                "element._id": { $in: turns.map((turn) => turn.id) },
                "element.disponible": true,
              },
            ],
            new: true,
          }
        );

        res.json(updatedUser);
      } else {
        let updatedUser = await User.findByIdAndUpdate(
          _id,
          {
            $push: {
              wishlist: { prodId, turns: turns.map((turn) => turn.id) },
            },
          },
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
                "element._id": { $in: turns.map((turn) => turn.id) },
                "element.disponible": true,
              },
            ],
            new: true,
          }
        );

        res.json(updatedUser);
      }
    } else {
      res
        .status(400)
        .json({
          error: "Alguno de los turnos seleccionados ya ha sido tomado.",
        });
    }
  } catch (error) {
    throw new Error(error);
  }
});
const cancelTurns = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { prodId, turns } = req.body;

  try {
    const user = await User.findById(_id);
    const product = await Product.findById(prodId);

    if (!user || !product) {
      return res.status(400).json({ error: "Usuario o producto no encontrado." });
    }

    const canceledTurns = turns.map((turn) => turn.id);
    await Product.findByIdAndUpdate(
      prodId,
      {
        $set: {
          "turns.$[element].disponible": true,
        },
      },
      {
        arrayFilters: [
          {
            "element._id": { $in: canceledTurns },
            "element.disponible": false,
          },
        ],
        new: true,
      }
    );
    await User.findByIdAndUpdate(
      _id,
      { $pull: { "wishlist.$[item].turns": { $in: canceledTurns } } },
      { arrayFilters: [{ "item.prodId": prodId }], new: true }
    );
    user.cancellationHistory = user.cancellationHistory || [];
    user.cancellationHistory.push({
      canceledTurns,
      canceledAt: new Date(),
    });

    await user.save();

    res.json({ message: "Turnos cancelados exitosamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cancelar los turnos." });
  }
});
const userCancelledTurns = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongodbId(_id);

  try {
    const user = await User.findById(_id).populate({
      path: 'wishlist.prodId',
      populate: {
        path: 'turns.cancellations.cancelledBy',
        model: 'User',
        select: 'firstname', // selecciona solo el campo necesario
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const cancelHistory = [];

    user.wishlist.forEach((wishlistItem) => {
      wishlistItem.turns.forEach((turn) => {
        if (turn.cancellations && turn.cancellations.length > 0) {
          const cancellationInfo = {
            productId: wishlistItem.prodId._id,
            productName: wishlistItem.prodId.name,
            turnId: turn._id,
            cancelledBy: turn.cancellations[0].cancelledBy.firstname,
            cancelledAt: turn.cancellations[0].cancelledAt,
          };

          cancelHistory.push(cancellationInfo);
        }
      });
    });

    res.json(cancelHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el historial de cancelaciones.' });
  }
});



module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getaProduct,
  getAllProduct,
  addToWishlist,
  cancelTurns,
  userCancelledTurns,
};
