const User = require("../models/user");
const bcrypt = require("bcryptjs");
const validator = require("validator");
//
module.exports = {
  createUser: async ({ userInput }, req) => {
    const { email, name, password } = userInput;

    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: "E-mail is invalid" });
    }

    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    ) {
      errors.push({ message: "Your password is invalid" });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input!!");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const error = new Error("User exists already!!!");
      throw error;
    }
    const hashedPw = await bcrypt.hash(password, 12);

    const createdUser = new User({
      email,
      name,
      password: hashedPw,
    });
    const user = await createdUser.save();
    return { ...user._doc, _id: user._id.toString() };
  },
};
