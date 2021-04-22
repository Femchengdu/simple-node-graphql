const express = require("express");
const { body } = require("express-validator");
const {
  getPosts,
  postCreatePost,
  getPost,
  putEditPost,
  deletePost,
} = require("../controllers/feed");
const router = express.Router();

router.get("/posts", getPosts);
router.post(
  "/post",
  [
    body("title").trim().isLength({
      min: 5,
    }),
    body("content").trim().isLength({ min: 5 }),
  ],
  postCreatePost
);

router.get("/post/:postId", getPost);

router.put(
  "/post/:postId",
  [
    body("title").trim().isLength({
      min: 5,
    }),
    body("content").trim().isLength({ min: 5 }),
  ],
  putEditPost
);

router.delete("/post/:postId", deletePost);
module.exports = router;
