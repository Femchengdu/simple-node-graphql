const express = require("express");
const { body } = require("express-validator");
const { getPosts, postCreatePost } = require("../controllers/feed");
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

module.exports = router;
