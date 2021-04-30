const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const clearImage = require("../utils/file");
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
  posts: async ({ page }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!!");
      error.code = 401;
      throw error;
    }

    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const rawPosts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("creator");
    const posts = rawPosts.map((pst) => {
      const { _doc, _id, createdAt, updatedAt } = pst;
      return {
        ..._doc,
        _id: _id.toString(),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString,
      };
    });

    return { posts, totalPosts };
  },
  post: async ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!!");
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("No post found!!");
      error.code = 404;
      throw error;
    }

    const { _doc, _id, createdAt, updatedAt } = post;
    return {
      ..._doc,
      _id: _id.toString(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString,
    };
  },
  updatePost: async ({ id, postInput }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!!");
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("No post found!!");
      error.code = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Invalid operation!!");
      error.code = 403;
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
    post.title = title;
    post.content = content;
    if (imageUrl !== "undefined") {
      post.imageUrl = imageUrl;
    }

    const updatedPost = await post.save();
    const { _doc, _id, createdAt, updatedAt } = updatedPost;
    return {
      ..._doc,
      _id: _id.toString(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString,
    };
  },
  deletePost: async ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!!");
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id);
    if (!post) {
      const error = new Error("No post found!!");
      error.code = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error("Invalid operation!!");
      error.code = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(id);
    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();
    return true;
  },
  user: async (args, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!!");
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User not found!!");
      error.code = 401;
      throw error;
    }
    const { _doc, _id } = user;
    return {
      ..._doc,
      _id: _id.toString(),
    };
  },
  updateStatus: async ({ status }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!!");
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User not found!!");
      error.code = 401;
      throw error;
    }
    user.status = status;
    await user.save();
    const { _doc, _id } = user;
    return {
      ..._doc,
      _id: _id.toString(),
    };
  },
};
