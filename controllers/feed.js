const { validationResult } = require("express-validator");
const Post = require("../models/post");
exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: "1",
        title: "First Post",
        content: "This is my dream bike!",
        imageUrl: "images/hondaCbrRR.jpg",
        creator: { name: "rDev" },
        createdAt: new Date(),
      },
    ],
  });
};

exports.postCreatePost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed!!!", errors: errors.array() });
  }
  const { title, content } = req.body;
  const post = new Post({
    title,
    content,
    creator: { name: "rDev" },
    imageUrl: "images/hondaCbrRR.jpg",
  });
  post
    .save()
    .then((post) => {
      res.status(201).json({
        message: "Post created successfully!",
        post,
      });
    })
    .catch((error) => console.log(error));
};
