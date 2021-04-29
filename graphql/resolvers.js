const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
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
  login: async ({ email, password }, req) => {
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User not found!!");
      error.code = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Password is incorrect");
      error.code = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      process.env.SERVER_SECRET,
      { expiresIn: "1hr" }
    );

    return { token, userId: user._id.toString() };
  },
  createPost: async ({ postInput }, req) => {
    console.log("Do I receive the post input?", postInput);
    if (!req.isAuth) {
      const error = new Error("Not authenticated!!");
      error.code = 401;
      throw error;
    }
    const { title, content, imageUrl } = postInput;
    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({ message: "Title is invalid!!!" });
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({ message: "Content is invalid!!!" });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input!!");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid user!!");
      error.code = 401;
      throw error;
    }
    const createdPost = new Post({
      title,
      content,
      imageUrl,
      creator: user,
    });

    const post = await createdPost.save();
    user.posts.push(post);
    await user.save();
    const { _doc, _id, createdAt, updatedAt } = post;
    return {
      ..._doc,
      _id: _id.toString(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  },
};
