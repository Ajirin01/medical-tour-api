const GeneralController = require("./GeneralController");
const MedicalCertificate = require("../../models/medicalTourism/MedicalCertificate");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

class MedicalCertificateController extends GeneralController {
  constructor() {
    super(MedicalCertificate);
  }

  async createCertificate(req, res) {
    try {
      const { patient, doctor, issueDate, diagnosis, comment, certID } = req.body;

      if (!patient || !doctor || !diagnosis || !comment || !certID) {
        return res.status(400).json({ message: "All required fields must be filled" });
      }

      // Build the public URL for the certificate (adjust to your frontend domain)
      const publicUrl = `${process.env.FRONTEND_URL}/verify-certificate/${certID}`;

      // Generate QR code image as base64
      const qrCodeDataUrl = await QRCode.toDataURL(publicUrl);

      // Optional: Save base64 to file system (or save DataURL directly)
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
      const qrCodePath = path.join(__dirname, `../../uploads/qrcodes/${certID}.png`);
      fs.writeFileSync(qrCodePath, base64Data, "base64");

      const certificate = await MedicalCertificate.create({
        patient,
        doctor,
        issueDate,
        diagnosis,
        comment,
        certID,
        qrCodeUrl: `/uploads/qrcodes/${certID}.png`,
      });

      res.status(201).json({ message: "Certificate created", certificate });
    } catch (error) {
      console.error("Certificate creation error:", error);
      res.status(500).json({ message: "Failed to create certificate" });
    }
  }

  async updateCertificate(req, res) {
    try {
      const { certID, diagnosis, comment } = req.body;

      if (!certID || !diagnosis || !comment) {
        return res.status(400).json({ message: "certID, diagnosis, and comment are required" });
      }

      const certificate = await MedicalCertificate.findOneAndUpdate(
        { certID },
        { diagnosis, comment },
        { new: true }
      );

      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }

      res.status(200).json({ message: "Certificate updated", certificate });
    } catch (error) {
      console.error("Certificate update error:", error);
      res.status(500).json({ message: "Failed to update certificate" });
    }
  }

  async getCertificateByID(req, res) {
    try {
      const { id } = req.params;

    //   console.log(id)
      const certificate = await MedicalCertificate.findById(id).populate("patient doctor");

      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }

      res.status(200).json(certificate);
    } catch (error) {
      console.error("Fetch error:", error);
      res.status(500).json({ message: "Failed to fetch certificate" });
    }
  }

  async getAllCertificates(req, res) {
    try {
      const certificates = await MedicalCertificate.find().populate("patient doctor");
      res.status(200).json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  }

  async getCertificateByCertID(req, res) {
        try {
            const { certID } = req.params;

            if (!certID) {
            return res.status(400).json({ message: "Certificate ID is required" });
            }

            const certificate = await MedicalCertificate.findOne({ certID }).populate("patient doctor");

            if (!certificate) {
            return res.status(404).json({ message: "Certificate not found" });
            }

            res.status(200).json(certificate);
        } catch (error) {
            console.error("Fetch by certID error:", error);
            res.status(500).json({ message: "Failed to fetch certificate by certID" });
        }
    }
}

module.exports = {
  MedicalCertificateController: new MedicalCertificateController(),
};
