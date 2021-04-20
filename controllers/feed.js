const { validationResult } = require("express-validator");

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
  // Create post in db
  res.status(201).json({
    message: "Post created successfully!",
    post: {
      _id: new Date().toISOString(),
      title,
      content,
      creator: { name: "rDev" },
      createdAt: new Date(),
    },
  });
};
