const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const fs = require("fs");
//const https = require("https");
const clearImage = require("./utils/file");
const express = require("express");
const { json: bodyParserJson } = require("body-parser");
const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const auth = require("./middleware/isAuth");
const mongoose = require("mongoose");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
//const csrf = require("csurf");
const app = express();

// const tlsOptions = {
//   key: fs.readFileSync("server.key"),
//   cert: fs.readFileSync("server.cert"),
// };
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

// Filefilter for multer
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const stream = fs.createWriteStream(path.join(__dirname, "access.logs"), {
  flags: "a",
});

app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream }));

app.use(bodyParserJson());
app.use(multer({ storage, fileFilter }).single("image"));
// Serve static file using experss middleware
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.static(path.join(__dirname, "frontend")));
// Set Cors headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  //res.setHeader("Content-Security-Policy", "script-src 'self'");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(auth);

// work around fro graphql
app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }
  if (!req.file) {
    return res.status(200).json({ message: "No file provided" });
  }
  if (req.body.oldPath) {
    clearImage(oldPath);
  }

  return res
    .status(201)
    .json({ message: "File saved!!!", imageUrl: req.file.path });
});

// GraphQl
app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn: (error) => {
      if (!error.originalError) {
        return error;
      }

      const {
        originalError: { data, code },
        message,
      } = error;

      return {
        status: code,
        message: message ? message : "An error occured",
        data,
      };
    },
  })
);

// Error handler
app.use((error, req, res, next) => {
  console.log(error);
  const { statusCode, message, data } = error;
  res.status(statusCode || 500).json({ message, data });
});
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useFindAndModify", false);
mongoose
  .connect(process.env.MONGODB_MESSAGES_URI)
  .then((result) => {
    app.listen(process.env.PORT || 3090, () =>
      console.log("Express App started!!!")
    );
    // https
    //   .createServer(tlsOptions, app)
    //   .listen(3090, () => console.log("Express App started!!!"));
  })
  .catch((error) => console.log(error));
