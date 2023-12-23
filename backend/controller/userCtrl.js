const Product = require("../models/productModel.js")
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwtToken.js");
const validateMongoDbId = require("../utils/validateMongodbId.js");
const { generateRefreshToken } = require("../config/refreshtoken.js");
const crypto = require("crypto")
const jwt = require("jsonwebtoken");



const createUser = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const findUser = await User.findOne({ email: email });
  if (!findUser) {
    const newUser = await User.create(req.body);
    res.json(newUser);
  } else {
    throw new Error("Este usuario ya existe.");
  }
});
const updatedUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        firstname: req?.body?.firstname,
        lastname: req?.body?.lastname,
        email: req?.body?.email,
        mobile: req?.body?.mobile,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});
const handleRefreshToken = asyncHandler(async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie?.refreshToken)
      throw new Error("No existe Refresh Token en la Cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) throw new Error("No hay Refresh Token en la base de datos");
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err || user.id !== decoded.id) {
        throw new Error("Algo mal está ocurriendo con el Refresh Token");
      }
      const accessToken = generateToken(user?._id);
      res.json({ accessToken });
    });
  } catch (error) {
    next(error);
  }
});
const getallUser = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find();
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});
const getaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    validateMongoDbId(id);
    const getaUser = await User.findById(id);

    if (!getaUser) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.json({
      getaUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});
const deleteaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    validateMongoDbId(id);
    const deleteUser = await User.findByIdAndDelete(id);
    res.json({
      deleteUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await User.findByIdAndUpdate(
      findUser.id,
      { refreshToken: refreshToken },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findUser?._id,
      firstname: findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),
    });
  } else {
    throw new Error("Credencial inválida.");
  }
});
const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken)
    throw new Error("No hay Refresh Token en la Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204);
  }
  await User.findOneAndUpdate({ refreshToken }, { $set: { refreshToken: "" } });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204);
});
const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongoDbId(_id);
  const user = await User.findById(_id);

  if (password) {
    user.password = password;
    user.passwordChangedAt = new Date();
    await user.createPasswordResetToken();

    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.json(user);
  }
});
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Usuario no encontrado.");
  }

  const resetToken = user.createPasswordResetToken();
  await user.save();

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "nachof5cjs@gmail.com",
      pass: "ennu gwhu cntr imki", 
    },
  });
  const mailOptions = {
    from: "nachof5cjs@gmail.com",
    to: user.email,
    subject: "Restablecimiento de contraseña",
    html: `Haga clic en el siguiente enlace para restablecer su contraseña: <a href="http://localhost:3050/api/user/reset-password/${resetToken}">Restablecer contraseña</a>`,
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      throw new Error("Error al enviar el correo electrónico de restablecimiento de contraseña.");
    } else {
      console.log("Email sent:", info.response);
      res.json({ message: "Se ha enviado un enlace de restablecimiento a su correo electrónico." });
    }
  });
});
const resetPassword = asyncHandler(async(req, res)=> {
  const {password} = req.body
  const {token} = req.params
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now()}
  })
  if (!user) throw new Error("Token expirado, por favor intentalo nuevamente.")
  user.password = password
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()
  res.json(user)
})

module.exports = {
  createUser,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPassword,
  resetPassword,
};
