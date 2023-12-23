const {default: mongoose} = require("mongoose")

const dbConnect = () => {
  try {
    const conn = mongoose.connect(process.env.MONGODB_URL);
    console.log("La base de datos está ON")
  } catch (error) {
    throw new Error(error);
  }
};
module.exports = dbConnect;
