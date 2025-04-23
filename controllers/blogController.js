const asyncHandler = require("express-async-handler");
const Blog = require("../models/Blog");

const createBlog = asyncHandler(async (req, res) => {
  console.log("Received form data:", req.body);

  const { title, content, tags, isPublished } = req.body;
  const featuredImage = req.file ? req.file.path : undefined;

  if (!title || !content) {
    res.status(400);
    throw new Error("Title and content are required");
  }

  const blog = new Blog({
    title,
    content,
    author: req.user._id,
    tags: tags ? tags.split(",") : [],
    isPublished: isPublished === "true",
    featuredImage,
  });

  const createdBlog = await blog.save();
  res.status(201).json(createdBlog);
});

const getBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find().populate("author", "firstName lastName");
  res.json(blogs);
});

const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate(
    "author",
    "firstName lastName"
  );
  if (blog) {
    res.json(blog);
  } else {
    res.status(404);
    throw new Error("Blog not found");
  }
});

const updateBlog = asyncHandler(async (req, res) => {
  console.log("Received form data for update:", req.body);

  const { title, content, tags } = req.body;
  const isPublished = req.body.isPublished === "true";
  const featuredImage = req.file ? req.file.path : undefined;

  const blog = await Blog.findById(req.params.id);

  if (blog) {
    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.tags = tags ? tags.split(",").map((tag) => tag.trim()) : blog.tags;
    blog.isPublished =
      isPublished !== undefined ? isPublished : blog.isPublished;
    if (featuredImage) {
      blog.featuredImage = featuredImage;
    }

    const updatedBlog = await blog.save();
    res.json(updatedBlog);
  } else {
    res.status(404);
    throw new Error("Blog not found");
  }
});

const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (blog) {
    await blog.remove();
    res.json({ message: "Blog removed" });
  } else {
    res.status(404);
    throw new Error("Blog not found");
  }
});

module.exports = {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
};
