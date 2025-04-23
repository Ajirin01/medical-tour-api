const express = require("express");
const {
  registerUser,
  verifyOTP,
  resendOTP,
  authUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  updateUserAvailability,
  updateAvailability,
  getAvailableSpecialist,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "..");
const uploadProfileDir = path.join(projectRoot, "uploads", "profile-images");
const uploadLicenseDir = path.join(projectRoot, "uploads", "licenses");

// Create the directories if they don't exist
[uploadProfileDir, uploadLicenseDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Set up multer for file uploads
const profileImageStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadProfileDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `user-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const licenseStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadLicenseDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `license-${req.user ? req.user._id : "new"}-${Date.now()}${path.extname(
        file.originalname
      )}`
    );
  },
});

function checkFileType(file, cb, allowedTypes) {
  const filetypes = new RegExp(allowedTypes.join("|"));
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(`Files must be in ${allowedTypes.join(", ")} format`);
  }
}

const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: (req, file, cb) =>
    checkFileType(file, cb, ["jpeg", "jpg", "png"]),
});

const uploadLicense = multer({
  storage: licenseStorage,
  fileFilter: (req, file, cb) =>
    checkFileType(file, cb, ["jpeg", "jpg", "pdf", "doc", "docx"]),
});

// New upload middleware for combined profile image and license uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === "profileImage") {
        cb(null, uploadProfileDir);
      } else if (file.fieldname === "currentPracticingLicense") {
        cb(null, uploadLicenseDir);
      }
    },
    filename: function (req, file, cb) {
      const userId = req.user ? req.user._id : "new";
      const prefix = file.fieldname === "profileImage" ? "user" : "license";
      cb(
        null,
        `${prefix}-${userId}-${Date.now()}${path.extname(file.originalname)}`
      );
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "profileImage") {
      checkFileType(file, cb, ["jpeg", "jpg", "png"]);
    } else if (file.fieldname === "currentPracticingLicense") {
      checkFileType(file, cb, ["jpeg", "jpg", "pdf", "doc", "docx"]);
    } else {
      cb(new Error("Unexpected field"));
    }
  },
}).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "currentPracticingLicense", maxCount: 1 },
]);

// Register route with file uploads for specialists
router.post(
  "/register",
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: "File upload error: " + err.message });
      } else if (err) {
        return res
          .status(500)
          .json({ message: "Unknown error: " + err.message });
      }
      next();
    });
  },
  registerUser
);

router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", authUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(
    protect,
    (req, res, next) => {
      upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          return res
            .status(400)
            .json({ message: "File upload error: " + err.message });
        } else if (err) {
          return res
            .status(500)
            .json({ message: "Unknown error: " + err.message });
        }
        next();
      });
    },
    updateUserProfile
  );

router.put("/availability", protect, updateUserAvailability);

router.put("/update-availability", protect, updateAvailability);

router.put("/availability", protect, updateAvailability);

router.get("/specialists/available/:category", protect, getAvailableSpecialist);

module.exports = router;
