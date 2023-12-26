const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const dbConnect = require("./config/dbConnect");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3050;
const auhtRouter = require("./routes/authRoute");
const productRouter = require("./routes/productRoute");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
dbConnect();

app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api/user", auhtRouter);
app.use("/api/product", productRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`El servidor está en el PUERTO ${PORT}`);
});
