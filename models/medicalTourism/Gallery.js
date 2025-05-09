// models/gallery.model.js
const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
});

module.exports = mongoose.model('Gallery', gallerySchema);
