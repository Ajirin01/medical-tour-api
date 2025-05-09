const GeneralController = require('./GeneralController');
const Blog = require('../../models/medicalTourism/Blog');

class BlogController extends GeneralController {
  constructor() {
    super(Blog);
  }

  // Custom create logic for Blog
  async createCustom(req, res) {
    try {
      const { title, content, author, tags, isPublished, featuredImage } = req.body;
      const photo = req.file?.path || req.file?.filename;  // If there's an image uploaded

      const newBlogItem = new Blog({
        title,
        content,
        author,
        tags,
        isPublished,
        featuredImage: photo,
      });

      const savedItem = await newBlogItem.save();
      return res.status(201).json(savedItem);
    } catch (error) {
      console.error("Blog create error:", error);
      return res.status(500).json({ message: "Failed to create blog item" });
    }
  }

  // Custom update logic for Blog
  async updateCustom(req, res) {
    try {
      const { id } = req.params;
      const { title, content, author, tags, isPublished, featuredImage } = req.body;
      const photo = req.file?.path;

      const updateFields = {
        title,
        content,
        author,
        tags,
        isPublished,
      };

      if (photo) updateFields.featuredImage = photo;

      const updatedItem = await Blog.findByIdAndUpdate(id, updateFields, {
        new: true,
      });

      if (!updatedItem) {
        return res.status(404).json({ message: "Blog item not found" });
      }

      return res.status(200).json(updatedItem);
    } catch (error) {
      console.error("Blog update error:", error);
      return res.status(500).json({ message: "Failed to update blog item" });
    }
  }

  // Custom logic to get all blogs
  async getAllBlogs(req, res) {
    try {
      const blogs = await Blog.find().populate('author', 'name email').sort({ publishedDate: -1 });
      return res.status(200).json(blogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      return res.status(500).json({ message: "Failed to fetch blogs" });
    }
  }

  // Custom logic to get a single blog by ID
  async getBlogById(req, res) {
    try {
      const { id } = req.params;
      const blog = await Blog.findById(id).populate('author', 'name email');

      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      return res.status(200).json(blog);
    } catch (error) {
      console.error("Error fetching blog by ID:", error);
      return res.status(500).json({ message: "Failed to fetch blog by ID" });
    }
  }

}

module.exports = {
  BlogController: new BlogController(),
};
