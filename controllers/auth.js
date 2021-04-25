const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
exports.putSignup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed!!!");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { email, password, name } = req.body;
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email,
        password: hashedPassword,
        name,
      });
      return user.save();
    })
    .then((result) => {
      res
        .status(201)
        .json({ message: "User signedup successfully!!!", userId: result._id });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  let loadedUser;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        const error = new Error("User not found!!!");
        error.statusCode = 401;
        error.data = errors.array();
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((passwordMatch) => {
      if (!passwordMatch) {
        const error = new Error("Wrong password!!!");
        error.statusCode = 401;
        error.data = errors.array();
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        process.env.SERVER_SECRET,
        { expiresIn: "1hr" }
      );
      res.status(200).json({ token, userId: loadedUser._id.toString() });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not found!!!");
        error.statusCode = 404;
        error.data = errors.array();
        throw error;
      }
      const { status } = user;
      res.status(200).json({ status });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.patchStatus = (req, res, next) => {
  const { status } = req.body;
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not found!!!");
        error.statusCode = 404;
        error.data = errors.array();
        throw error;
      }
      user.status = status;
      return user.save();
    })
    .then((user) => {
      res.status(200).json({ message: "User updated" });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};
