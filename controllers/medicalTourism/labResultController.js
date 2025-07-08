const GeneralController = require('./GeneralController');
const LabResult = require('../../models/medicalTourism/LabResult');
const LabReferral = require('../../models/medicalTourism/LabReferral');

const handlebars = require("handlebars");
const sendEmail = require("../../utils/medicalTourism/sendEmail");
const Laboratory = require("../../models/medicalTourism/Laboratory");
const UserModel = require("../../models/medicalTourism/User");
const VideoSession = require("../../models/medicalTourism/VideoSession");

const path = require('path'); // Import path module
const fs = require('fs');
class LabResultController extends GeneralController {
    constructor() {
        super(LabResult);
    }

    // Custom GET with optional status filter
    async getAllLabResults(req, res) {
        try {
            const { status } = req.query;
            const query = status ? { status } : {};
            const labResults = await LabResult.find(query).populate("user");
            res.status(200).json(labResults);
        } catch (error) {
            console.error("Error fetching labResults:", error);
            res.status(500).json({ message: "Failed to fetch labResults" });
        }
    }

    // 🔽 Custom create with resultFile image
    async customCreate(req, res) {
        try {
            const labResultData = { ...req.body };

            if (req.file) {
                // Handle file upload path
                labResultData.resultFile = `/uploads/${req.file.filename}`;
            }

            const newPharmacy = await LabResult.create(labResultData);
            res.status(201).json(newPharmacy);
        } catch (error) {
            console.error("LabResult creation error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    // 🔽 Custom update with resultFile image
    async customUpdate(req, res) {
        try {
            const { id } = req.params;
            if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({ message: "Invalid ID format" });
            }

            const labResult = await LabResult.findById(id);
            if (!labResult) {
                return res.status(404).json({ message: "LabResult not found" });
            }

            const updateData = { ...req.body };

            if (req.file) {
                // 🔥 Delete old resultFile file if it exists
                if (labResult.resultFile) {
                    const oldFilePath = path.join(__dirname, '..', '..', 'public', labResult.resultFile);
                    fs.unlink(oldFilePath, (err) => {
                        if (err) console.warn("Failed to delete old resultFile file:", err.message);
                    });
                }

                // 💾 Set new resultFile path
                updateData.resultFile = `/uploads/${req.file.filename}`;
            }

            const updatedPharmacy = await LabResult.findByIdAndUpdate(id, updateData, { new: true });

            res.status(200).json(updatedPharmacy);
        } catch (error) {
            console.error("LabResult update error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    async getAllFileBasedReferrals(req, res) {
        try {
            const { status, patient } = req.query;
            let labId = req.query.lab;

            // 🧠 Get user info from middleware or JWT
            const user = req.user; // Assuming you set this via auth middleware

            // If the user is a labAdmin, override labId with their own lab
            if (user && user.role === "labAdmin") {
                const lab = await Laboratory.findOne({ labAdmin: user._id });
                if (!lab) {
                    return res.status(404).json({ message: "No laboratory found for this admin" });
                }
                labId = lab._id;
            }

            // Build query
            const query = {};
            if (status) query.status = status;
            if (patient) query.patient = patient;
            if (labId) query.lab = labId;

            const referrals = await LabReferral.find(query).populate("patient doctor lab session");

            res.status(200).json(referrals);
        } catch (error) {
            console.error("Error fetching file-based referrals:", error);
            res.status(500).json({ message: "Failed to fetch referrals" });
        }
    }

    // ✅ Get lab referrals by user ID
    async getLabReferralsByUser(req, res) {
    try {
        const isAdmin = req.user.role === "admin" || req.user.role === "superAdmin";
        const userFilter = isAdmin ? {} : { user: req.params.userId };

        const sessions = await VideoSession.find({
        ...userFilter,
        labReferrals: { $exists: true, $not: { $size: 0 } },
        })
        .populate("user specialist appointment")
        .sort({ createdAt: -1 });

        res.status(200).json({ success: true, sessions });
    } catch (error) {
        console.error("Error fetching lab referrals by user:", error);
        this.handleError(res, "Failed to fetch lab referrals");
    }
    }


    // 🆕 Create new referral with file upload
    async createFileBasedReferral(req, res) {
        try {
            const data = { ...req.body };

            if (req.file) {
                data.fileUrl = `/uploads/${req.file.filename}`;
            }

            const referral = await LabReferral.create(data);
            res.status(201).json(referral);
        } catch (error) {
            console.error("File-based referral creation error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    // ✏️ Update existing referral and replace file if applicable
    async updateFileBasedReferral(req, res) {
        try {
            const { id } = req.params;

            const referral = await LabReferral.findById(id);
            if (!referral) {
                return res.status(404).json({ message: "Referral not found" });
            }

            const updateData = { ...req.body };

            if (req.file) {
                // 🧹 Remove old file
                if (referral.fileUrl) {
                    const oldPath = path.join(__dirname, '..', '..', 'public', referral.fileUrl);
                    fs.unlink(oldPath, (err) => {
                        if (err) console.warn("Failed to delete old result file:", err.message);
                    });
                }

                updateData.fileUrl = `/uploads/${req.file.filename}`;
            }

            const updated = await LabReferral.findByIdAndUpdate(id, updateData, { new: true });
            res.status(200).json(updated);
        } catch (error) {
            console.error("File-based referral update error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    // ❌ Delete referral and file
    async deleteFileBasedReferral(req, res) {
        try {
            const { id } = req.params;

            const referral = await LabReferral.findById(id);
            if (!referral) {
                return res.status(404).json({ message: "Referral not found" });
            }

            // Delete file if present
            if (referral.fileUrl) {
                const filePath = path.join(__dirname, '..', '..', 'public', referral.fileUrl);
                fs.unlink(filePath, (err) => {
                    if (err) console.warn("Failed to delete file:", err.message);
                });
            }

            await LabReferral.findByIdAndDelete(id);
            res.status(200).json({ message: "Referral deleted successfully" });
        } catch (error) {
            console.error("File-based referral deletion error:", error);
            res.status(500).json({ error: error.message });
        }
    }

   // controllers/LabReferralController.js
    async sendReferralToLab(req, res) {
        try {
            const { session, patient, lab, note } = req.body;

            if (!session || !patient || !lab) {
            return res.status(400).json({ success: false, message: "Missing required fields: session, patient, or lab" });
            }

            const doctor = req.user?._id;
            if (!doctor) return res.status(403).json({ success: false, message: "Unauthorized doctor" });

            const existing = await LabReferral.findOne({ session, patient, lab });
            if (existing) {
            return res.status(200).json({ success: true, message: "Referral already exists", referral: existing });
            }

            const [sessionData, labData, patientData, doctorData] = await Promise.all([
            VideoSession.findById(session),
            Laboratory.findById(lab).populate("labAdmin"),
            UserModel.findById(patient),
            UserModel.findById(doctor),
            ]);

            if (!sessionData || !labData || !patientData || !doctorData) {
            return res.status(404).json({ success: false, message: "One or more entities not found" });
            }

            const referralData = {
            session,
            patient,
            doctor,
            lab,
            note: note || "",
            status: "pending",
            referredAt: new Date(),
            };

            const referral = await LabReferral.create(referralData);

            const templatePath = path.join(__dirname, "../../templates/email-template.html");
            const templateSource = fs.readFileSync(templatePath, "utf8");
            const compileTemplate = handlebars.compile(templateSource);

            const commonDetails = `
            🧪 Lab Referral ID: ${referral._id}
            👤 Patient: ${patientData.firstName} ${patientData.lastName || ""}
            💬 Note: ${note || "—"}
            📅 Referred: ${new Date(referral.referredAt).toLocaleString()}
            `;

            const labHtml = compileTemplate({
            subject: "New Lab Referral",
            recipientName: labData.labAdmin?.firstName || "Lab Admin",
            bodyIntro: `You have received a new referral from Dr. ${doctorData.firstName} ${doctorData.lastName}.`,
            highlightText: `Laboratory: ${labData.name}`,
            bodyOutro: commonDetails,
            year: new Date().getFullYear(),
            });

            const patientHtml = compileTemplate({
            subject: "Your Lab Referral",
            recipientName: patientData.firstName || "Patient",
            bodyIntro: `You have been referred to the lab \"${labData.name}\" by Dr. ${doctorData.firstName}.`,
            highlightText: `Referred Laboratory: ${labData.name}`,
            bodyOutro: commonDetails,
            year: new Date().getFullYear(),
            });

            await Promise.all([
            sendEmail(labData.labAdmin?.email, "New Lab Referral", labHtml),
            sendEmail(patientData.email, "Lab Referral Sent", patientHtml),
            ]);

            return res.status(201).json({ success: true, referral });
        } catch (error) {
            console.error("Error sending referral to lab:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }



}

module.exports = {
    LabResultController: new LabResultController()
};
