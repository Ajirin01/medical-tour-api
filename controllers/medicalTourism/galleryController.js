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

      console.log("$$$$$", photo)

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
}

module.exports = {
  GalleryController: new GalleryController(),
};
