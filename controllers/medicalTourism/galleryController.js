const GeneralController = require('./GeneralController');
const Gallery = require('../../models/medicalTourism/Gallery');

class GalleryController extends GeneralController {
  constructor() {
    super(Gallery);
  }

  // Custom create logic
  async createCustom(req, res) {
    try {
      const { title, description, category } = req.body;
      const photo = req.file.path || req.file.filename;

      const newGalleryItem = new Gallery({
        title,
        description,
        category,
        photo,
      });

      const savedItem = await newGalleryItem.save();
      return res.status(201).json(savedItem);
    } catch (error) {
      console.error("Gallery create error:", error);
      return res.status(500).json({ message: "Failed to create gallery item" });
    }
  }

  // Custom update logic
  async updateCustom(req, res) {
    try {
      const { id } = req.params;
      const { title, description, category } = req.body;
      const photo = req.file?.path;

      const updateFields = {
        title,
        description,
        category,
      };

      if (photo) updateFields.photo = photo;

      const updatedItem = await Gallery.findByIdAndUpdate(id, updateFields, {
        new: true,
      });

      if (!updatedItem) {
        return res.status(404).json({ message: "Gallery item not found" });
      }

      return res.status(200).json(updatedItem);
    } catch (error) {
      console.error("Gallery update error:", error);
      return res.status(500).json({ message: "Failed to update gallery item" });
    }
  }

  // Get all gallery items without pagination
async getAllNoPagination(req, res) {
    try {
      const items = await Gallery.find().sort({ createdAt: -1 }); // optional: sort by newest first
      return res.status(200).json(items);
    } catch (error) {
      console.error("Gallery fetch error:", error);
      return res.status(500).json({ message: "Failed to fetch gallery items" });
    }
  }
}

module.exports = {
  GalleryController: new GalleryController(),
};
