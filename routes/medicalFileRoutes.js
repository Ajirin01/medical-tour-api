const express = require("express");
const router = express.Router();
const medicalFileController = require("../controllers/medicalFileController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.get(
  "/:patientId",
  protect,
  authorize(["specialist", "admin"]),
  medicalFileController.getMedicalFile
);
router.put(
  "/:patientId",
  protect,
  authorize(["specialist"]),
  medicalFileController.updateMedicalFile
);

// New route for accessing prescriptions without special role authorization
router.get(
  "/:patientId/prescriptions",
  protect,
  medicalFileController.getPrescriptions
);

module.exports = router;
