const express = require("express");
const { body } = require("express-validator");
const isAuth = require("../middleware/isAuth");
const {
  getPosts,
  postCreatePost,
  getPost,
  putEditPost,
  deletePost,
} = require("../controllers/feed");
const router = express.Router();

router.get("/posts", isAuth, getPosts);
router.post(
  "/post",
  isAuth,
  [
    body("title").trim().isLength({
      min: 5,
    }),
    body("content").trim().isLength({ min: 5 }),
  ],
  postCreatePost
);

router.get("/post/:postId", isAuth, getPost);

router.put(
  "/post/:postId",
  isAuth,
  [
    body("title").trim().isLength({
      min: 5,
    }),
    body("content").trim().isLength({ min: 5 }),
  ],
  putEditPost
);

router.delete("/post/:postId", isAuth, deletePost);
module.exports = router;
