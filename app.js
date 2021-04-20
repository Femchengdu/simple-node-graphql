const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const { json: bodyParserJson } = require("body-parser");
const feedRoutes = require("./routes/feed");
const mongoose = require("mongoose");
const app = express();
//app.use(bodyParser.urlencoded()) // x-www-form-urlencoded
app.use(bodyParserJson());
// Set Cors headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use("/feed", feedRoutes);
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    app.listen(3090, () => console.log("Express App started!!!"));
  })
  .catch((error) => console.log(error));
