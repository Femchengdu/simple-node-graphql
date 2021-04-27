const fs = require("fs");
const path = require("path");
const User = require("../models/user");
const { validationResult } = require("express-validator");
const Post = require("../models/post");
const io = require("../socket");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    let totalItems = await Post.find().countDocuments();

    const posts = await Post.find()
      .populate("creator")
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "Posts fetched successfully!",
      posts,
      totalItems,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.postCreatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed!!!");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No image provided!!!");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const { title, content } = req.body;
  const post = new Post({
    title,
    content,
    creator: req.userId,
    imageUrl,
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    io.getIO().emit("posts", {
      action: "create",
      post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
    });
    res.status(201).json({
      message: "Post created successfully!",
      post,
      creator: user,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getPost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Post fetched!!!", post });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.putEditPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed!!!");
    error.statusCode = 422;
    throw error;
  }
  const { postId } = req.params;
  const { title, content } = req.body;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error("No image file found!!!.");
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(postId).populate("creator");

    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error("Not authorized!!!");
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    const saveResult = await post.save();
    io.getIO().emit("posts", {
      action: "update",
      post: saveResult,
    });
    res
      .status(200)
      .json({ message: "Edited successfully!!!", post: saveResult });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not authorized!!!");
      error.statusCode = 403;
      throw error;
    }

    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);

    const user = await User.findById(req.userId);

    user.posts.pull(postId);
    await user.save();

    res.status(200).json({ message: "Post deleted successfully !!" });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const clearImage = (imagePath) => {
  const filePath = path.join(__dirname, "..", imagePath);
  fs.unlink(filePath, (error) => console.log(error));
};
