const User = require("../models/user");
const bcrypt = require("bcryptjs");
module.exports = {
  createUser: async ({ userInput }, req) => {
    const { email, name, password } = userInput;
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
