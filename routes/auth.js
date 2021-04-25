const express = require("express");
const { body } = require("express-validator");
const isAuth = require("../middleware/isAuth");
const User = require("../models/user");
const {
  putSignup,
  postLogin,
  getStatus,
  patchStatus,
} = require("../controllers/auth");
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

router.post("/login", postLogin);

router.get("/status", isAuth, getStatus);

router.patch(
  "/status",
  isAuth,
  [body("status").trim().not().isEmpty()],
  patchStatus
);
module.exports = router;
