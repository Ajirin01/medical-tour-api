const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} = require("../controllers/blogController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.route("/").post(protect, createBlog).get(getBlogs);

router
  .route("/:id")
  .get(getBlogById)
  .put(protect, updateBlog)
  .delete(protect, deleteBlog);

router.post("/", protect, upload.single("featuredImage"), createBlog);
router.put("/:id", protect, upload.single("featuredImage"), updateBlog);

module.exports = router;
