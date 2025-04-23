const fs = require('fs');
const path = require('path');
const GeneralController = require('./GeneralController');
const ConsultationDocumentation = require('../../models/medicalTourism/ConsultationDocumentation');

class ConsultationDocumentationController extends GeneralController {
  constructor() {
    super(ConsultationDocumentation);
  }

  async getOneCustom(req, res) {
    try {
      const { id } = req.params;
  
      const documentation = await ConsultationDocumentation.findById(id).populate({
        path: "appointment",
        populate: [
          { path: "patient" },
          { path: "consultant" }
        ],
      });
  
      if (!documentation) {
        return res.status(404).json({ error: "Documentation not found." });
      }
  
      res.status(200).json(documentation);
    } catch (error) {
      console.error("GetOneCustom Error:", error);
      res.status(500).json({ error: "Failed to fetch documentation." });
    }
  }

  async getAllCustom(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        appointment,
        patientName,
        startDate,
        endDate,
      } = req.query;
  
      const filters = {};
  
      // Filter by appointment ID
      if (appointment) {
        filters.appointment = appointment;
      }
  
      // Date range filter
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
      }
  
      // Base query with filters
      let query = ConsultationDocumentation.find(filters).populate({
        path: "appointment",
        populate: {
          path: "patient",
        },
      });
  
      // In-memory filtering by patient name
      if (patientName) {
        query = query.where("appointment").ne(null); // ensure populated
      }
  
      const totalDocs = await ConsultationDocumentation.countDocuments(filters);
      const docs = await query
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
  
      // Final filter if patientName was requested
      const filteredDocs = patientName
        ? docs.filter((doc) => {
            const name = `${doc.appointment?.patient?.firstName || ""} ${doc.appointment?.patient?.lastName || ""}`;
            return name.toLowerCase().includes(patientName.toLowerCase());
          })
        : docs;
  
      res.status(200).json({
        data: filteredDocs,
        total: patientName ? filteredDocs.length : totalDocs,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch (error) {
      console.error("GetAllCustom Error:", error);
      res.status(500).json({ error: "Failed to fetch documentation." });
    }
  }

  async createCustom(req, res) {
    try {
      const { appointment, notes } = req.body;
      const documentPath = req.file?.path;

      const documentation = await ConsultationDocumentation.create({
        appointment,
        notes,
        documents: documentPath ? [documentPath] : [],
      });

      res.status(201).json(documentation);
    } catch (error) {
      console.error("Create Error:", error);
      res.status(500).json({ message: "Failed to create documentation.", error: error});
    }
  }

  async updateCustom(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const newDoc = req.file?.path;

      const documentation = await ConsultationDocumentation.findById(id);
      if (!documentation) return res.status(404).json({ error: "Not found." });

      documentation.notes = notes;

      // Append the new single file if uploaded
      if (newDoc) {
        documentation.documents.push(newDoc);
      }

      await documentation.save();
      res.status(200).json(documentation);
    } catch (error) {
      console.error("Update Error:", error);
      res.status(500).json({ error: "Failed to update documentation." });
    }
  }

  async deleteCustom(req, res) {
    try {
      const { id } = req.params;
      const documentation = await ConsultationDocumentation.findById(id);
      if (!documentation) return res.status(404).json({ error: "Not found." });

      // Delete all associated files
      documentation.documents.forEach((filePath) => {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      });

      await documentation.deleteOne();
      res.status(200).json({ message: "Documentation deleted successfully." });
    } catch (error) {
      console.error("Delete Error:", error);
      res.status(500).json({ error: "Failed to delete documentation." });
    }
  }

  // In ConsultationDocumentationController.js

    async deleteFile(req, res) {
        try {
        const { id } = req.params;
        const { filePath } = req.body; // Assuming filePath is passed in the request body
    
        const documentation = await ConsultationDocumentation.findById(id);
        if (!documentation) return res.status(404).json({ error: "Documentation not found." });
    
        // Remove the file path from the 'documents' array
        const fileIndex = documentation.documents.indexOf(filePath);
        if (fileIndex === -1) return res.status(400).json({ error: "File not found in documentation." });
    
        // Delete the file from the file system
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath); // Delete the file from the server
        }
    
        // Remove the file from the documents array
        documentation.documents.splice(fileIndex, 1);
        await documentation.save(); // Save the updated documentation
    
        res.status(200).json({ message: "File deleted successfully." });
        } catch (error) {
        console.error("Delete File Error:", error);
        res.status(500).json({ error: "Failed to delete file." });
        }
    }

    async addFile(req, res) {
        try {
          const { id } = req.params;
          const newDoc = req.file?.path;
      
          const documentation = await ConsultationDocumentation.findById(id);
          if (!documentation) return res.status(404).json({ error: "Not found." });
      
          // Append the new single file if uploaded
          if (newDoc) {
            documentation.documents.push(newDoc);
          }
      
          await documentation.save();
          res.status(200).json(documentation);
        } catch (error) {
          console.error("Update Error:", error);
          res.status(500).json({ message: "Failed to update documentation.",  error});
        }
      }
      
  
}

module.exports = {
  ConsultationDocumentationController: new ConsultationDocumentationController(),
};
