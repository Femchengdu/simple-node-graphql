const express = require("express");
const { body } = require("express-validator");

const User = require("../models/user");
const { putSignup } = require("../controllers/auth");
const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((email, { req }) => {
        return User.findOne({ email }).then((userDoc) => {
          if (userDoc) {
            Promise.reject("E-Mail address already exists!");
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().not().isEmpty(),
  ],
  putSignup
);
module.exports = router;
