const axios = require("axios");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const GeneralController = require('./GeneralController');
const User = require('../../models/medicalTourism/User');
const crypto = require("crypto");
const sendEmail = require("../../utils/medicalTourism/sendEmail");
const generateOTP = require("../../utils/medicalTourism/generateOTP");

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

// Role-specific models
const Specialist = require('../../models/medicalTourism/SpecialistUser');
const Patient = require('../../models/medicalTourism/UserDefault');
const Consultant = require('../../models/medicalTourism/ConsultantUser');
const Admin = require('../../models/medicalTourism/AdminUser');
const SuperAdmin = require('../../models/medicalTourism/SuperAdminUser');


const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

const models = {
  specialist: Specialist,
  patient: Patient,
  consultant: Consultant,
  admin: Admin,
  superAdmin: SuperAdmin
};

class UserController extends GeneralController {
  constructor() {
    super(User);

    this.completeProfile = this.completeProfile.bind(this);
  }

  // controllers/UserController.js
  applyRoleSpecificFields(user, role, data) {
      if (role === 'specialist') {
      user.specialty       = data.specialty     || user.specialty;
      user.licenseNumber   = data.licenseNumber || user.licenseNumber;
      user.category        = data.category      || user.category;
      user.bio             = data.bio           || user.bio;
      user.experience      = data.experience    || user.experience;
      // assume languages is sent as comma‑separated string
      if (data.languages) {
          user.languages = data.languages
          .split(',')
          .map((l) => l.trim())
          .filter((l) => l);
      }
      } else if (role === 'consultant') {
      user.experience = data.experience    || user.experience;
      if (data.languages) {
          user.languages = data.languages
          .split(',')
          .map((l) => l.trim())
          .filter((l) => l);
      }
      }
      return user;
  }

  async register(req, res) {
    try {
      const { email, password, role, captchaToken } = req.body;
  
      console.log("register hit");
      // console.log(req.body);
  
      if (!email || !password || !role || !captchaToken) {
        return res.status(400).json({
          message: "Email, password, role, and captchaToken are required",
        });
      }
  
      // CAPTCHA Verification
      const captchaResponse = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
  
      if (!captchaResponse.data.success) {
        return res.status(400).json({ message: "Failed CAPTCHA verification" });
      }
  
      const existingUser = await User.findOne({ email });
  
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  
      // Compile the HTML template
      const source = fs.readFileSync(
        path.join(__dirname, "../../templates/email-template.html"),
        "utf8"
      );
      const template = handlebars.compile(source);
      const html = template({
        subject: "Verify Your Account",
        recipientName: email,
        bodyIntro: "You have requested to register an account on Zozo DigiCare.",
        highlightText: `Your OTP is: ${otp}`,
        bodyOutro: "Please enter the OTP in the app to verify your email. This code will expire in 10 minutes.",
        year: new Date().getFullYear(),
      });
  
      if (existingUser) {
        if (!existingUser.isEmailVerified) {
          existingUser.otp = otp;
          existingUser.otpExpires = otpExpires;
          await existingUser.save();
  
          await sendEmail(
            email,
            "Verify Your Account",
            html,
          );
  
          return res.status(200).json({
            message:
              "Email already registered but not verified. OTP resent to your email.",
          });
        }
  
        return res.status(400).json({ message: "Email already registered" });
      }
  
      // Register new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const Model = models[role] || User;
  
      const newUser = await Model.create({
        email,
        password: hashedPassword,
        role,
        otp,
        otpExpires,
      });
  
      await sendEmail(
        email,
        "Verify Your Account",
        html,
      );
  
      res.status(201).json({
        message: "Registration successful. Check your email for the OTP.",
        userId: newUser._id,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        message: "Registration failed",
        error: error.message,
      });
    }
  }
  

  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
  
      const user = await User.findOne({
        email,
        otp,
        otpExpires: { $gt: new Date() },
      });
  
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
  
      // Mark email as verified
      user.isEmailVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
  
      // Fetch full user data from the appropriate model
      const Model = models[user.role] || User;
      const fullUser = await Model.findById(user._id);
  
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );
  
      // Optional: Send welcome or verification success email
      const templateSource = fs.readFileSync(
        path.join(__dirname, "../../templates/email-template.html"),
        "utf8"
      );
      const template = handlebars.compile(templateSource);
  
      const html = template({
        subject: "Email Verified Successfully",
        recipientName: email,
        bodyIntro: "Your email has been successfully verified.",
        highlightText: "Welcome to Zozo DigiCare!",
        bodyOutro:
          "You can now log in and start using all the features of your account.",
        year: new Date().getFullYear(),
      });
  
      await sendEmail(
        email,
        "Email Verified Successfully",
        html,
      );
  
      res.status(200).json({
        message: "Email verified successfully",
        token,
        user: fullUser,
        redirectTo: user.isProfileComplete ? "dashboard" : "complete-profile",
      });
    } catch (error) {
      console.error("OTP Verification Error:", error);
      res.status(500).json({
        message: "OTP verification failed",
        error: error.message,
      });
    }
  }
  // Add the resendOtp method inside the UserController class

  async resendOtp(req, res) {
    try {
      const { email } = req.body;
  
      // Check if email is provided
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
  
      // Find the user by email
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Generate new OTP
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
  
      // Read and compile email template
      const templateSource = fs.readFileSync(
        path.join(__dirname, "../../templates/email-template.html"),
        "utf8"
      );
      const template = handlebars.compile(templateSource);
  
      const html = template({
        subject: "Verify Your Account",
        recipientName: email,
        bodyIntro:
          "You requested a new One-Time Password (OTP) for your Zozo DigiCare account.",
        highlightText: otp,
        bodyOutro: "This OTP will expire in 10 minutes. Please do not share it with anyone.",
        year: new Date().getFullYear(),
      });
  
      // Send the new OTP email
      await sendEmail(
        email,
        "Your New OTP Code",
        html,
      );
  
      res.status(200).json({
        message: "OTP has been resent to your email",
      });
    } catch (error) {
      console.error("Error resending OTP:", error);
      res.status(500).json({
        message: "Error resending OTP",
        error: error.message,
      });
    }
  }
  

  async login(req, res) {
    const { email, password, token } = req.body;

    // console.log(req.body)
  
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
  
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  
    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log({ message: "Invalid password" })

        return res.status(401).json({ message: "Invalid password" });
      }
    } else if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
  
        if (decoded.userId !== user.id) {
          return res.status(401).json({ message: "Invalid token" });
        }
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
    } else {
      return res.status(400).json({ message: "Password or token is required" });
    }
  
    const newToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
  
    return res.status(200).json({
      message: "Login successful",
      token: newToken,
      user,
    });
  }

  async completeProfile(req, res) {
    try {
      // 1) email query
      const email = req.query.email;
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // 2) find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // 3) pull in ALL specialist/consultant fields
      const {
        firstName,
        lastName,
        phone,
        specialty,
        licenseNumber,
        category,
        bio,
        experience,
        languages,
        signature
      } = req.body;

      // 4) basic fields
      user.firstName = firstName || user.firstName;
      user.lastName  = lastName  || user.lastName;
      user.phone     = phone     || user.phone;

      // 5) nested address
      user.address = {
        street:  req.body['address.street']  || user.address?.street,
        city:    req.body['address.city']    || user.address?.city,
        state:   req.body['address.state']   || user.address?.state,
        country: req.body['address.country'] || user.address?.country,
      };

      // 6) apply all role‐specific fields
      this.applyRoleSpecificFields(user, user.role, {
        specialty,
        licenseNumber,
        category,
        bio,
        experience,
        languages
      });

      // 7) handle multi‐file upload (requires upload.fields in your route)
      //    req.files = { profileImage: [...], practicingLicense: [...] }
      if (req.files) {
        const profileImgFile     = req.files.profileImage?.[0];
        const practicingLicFile  = req.files.practicingLicense?.[0];
        const signatureFile = req.files.signature?.[0];

        // — profileImage
        if (profileImgFile) {
          if (user.profileImage) {
            const oldImg = path.join(__dirname, '..', '..', 'public', user.profileImage);
            fs.unlink(oldImg, (err) => {
              if (err && err.code !== 'ENOENT') console.error('Deleting old profile image:', err);
            });
          }
          user.profileImage = `/uploads/${profileImgFile.filename}`;
        }

        // — practicingLicense (only for specialists)
        if (user.role === 'specialist' && practicingLicFile) {
          if (user.practicingLicense) {
            const oldLic = path.join(__dirname, '..', '..', 'public', user.practicingLicense);
            fs.unlink(oldLic, (err) => {
              if (err && err.code !== 'ENOENT') console.error('Deleting old license file:', err);
            });
          }
          user.practicingLicense = `/uploads/${practicingLicFile.filename}`;
        }
        if (user.role === 'specialist' && signatureFile) {
          if (user.signature) {
            const oldSig = path.join(__dirname, '..', '..', 'public', user.signature);
            fs.unlink(oldSig, (err) => {
              if (err && err.code !== 'ENOENT') console.error('Deleting old license file:', err);
            });
          }
          user.signature = `/uploads/${signatureFile.filename}`;
        }
      }

      // 8) mark complete & save
      user.isProfileComplete = true;
      await user.save();

      return res.status(200).json({
        message: 'Profile updated successfully',
        user,
      });
    } catch (err) {
      console.error('completeProfile error:', err);
      return res.status(500).json({
        message: 'Failed to complete profile',
        error: err.message,
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
  
      const user = await User.findOne({ email });
  
      // Always return success to prevent user enumeration
      if (!user) {
        return res
          .status(200)
          .json({ message: "If the email exists, a reset link has been sent." });
      }
  
      // Generate secure token and expiration
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
  
      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();
  
      // Construct reset link
      const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
      // Read and compile the template
      const templateSource = fs.readFileSync(
        path.join(__dirname, "../../templates/email-template.html"),
        "utf8"
      );
      const template = handlebars.compile(templateSource);
  
      const html = template({
        subject: "Password Reset Request",
        recipientName: email,
        bodyIntro: "You requested to reset your password for your Zozo DigiCare account.",
        highlightText: "Click the link below to reset your password:",
        bodyOutro: `<a href="${resetUrl}" style="color:#3498db; text-decoration:underline;">Reset Password</a><br><br>If you didn’t request this, just ignore this email.`,
        year: new Date().getFullYear(),
      });
  
      await sendEmail(
        email,
        "Password Reset Request",
        html,
      );
  
      res.status(200).json({ message: "If the email exists, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        message: "Error sending reset password email",
        error: error.message,
      });
    }
  }

  async testEmail(req, res) {
    try {
      // Read and compile the template
      const templateSource = fs.readFileSync(
        path.join(__dirname, "../../templates/email-template.html"),
        "utf8"
      );
      const template = handlebars.compile(templateSource);

      const emailBody = `
        📅 Date: 20/10/2025 
        ⏰ Time: 10:30 - 11:00
        💻 Mode: Video
        🔗 Please check your dashboard for more details.
      `;
  
      const html = template({
        subject: "Password Reset Request",
        recipientName: "mubarakolagoke@gmail.com",
        bodyIntro: "You requested to reset your password for your Zozo DigiCare account.",
        highlightText: "Click the link below to reset your password:",
        bodyOutro: emailBody,
        year: new Date().getFullYear(),
      });
  
      await sendEmail(
        "mubarakolagoke@gmail.com",
        "Password Reset Request",
        html,
      );
  
      res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
      console.error("Forgot password error:", error.message);
      res.status(500).json({
        message: "Error sending message",
        error: error.message,
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, token, password } = req.body;

      if (!email || !token || !password) {
        return res.status(400).json({ message: "Email, token, and new password are required", requestBody: req.body });
      }

      // Hash the received token to compare with stored hash
      const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const user = await User.findOne({
        email,
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired password reset token" });
      }

      // Hash new password and save
      user.password = await bcrypt.hash(password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Error resetting password", error: error.message });
    }
  }

  async updateUserInfo(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const allowedUpdates = [
            "firstName",
            "lastName",
            "phone",
            "address"
        ];

        const updates = {};
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        // Handle uploaded profile image
        if (req.file && req.file.path) {
            updates.profileImage = req.file.path;
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  }

  async deleteUser (req, res) {
      try {
          const { email } = req.query;
      
          if (!email) {
          return res.status(400).json({ message: "Email is required" });
          }
      
          const user = await User.findOne({ email });
      
          if (!user) {
          return res.status(404).json({ message: "User not found" });
          }
      
          await user.deleteOne();
      
          res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
          console.error("Error deleting user:", error);
          res.status(500).json({ message: "Failed to delete user", error: error.message });
      }
  };

  async getUserByEmail(req, res) {
      try {
        const { email } = req.query;
    
        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }
    
        const user = await User.findOne({ email });
    
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
    
        const Model = models[user.role] || User;
        const fullUser = await Model.findById(user._id);
    
        res.status(200).json(fullUser);
      } catch (error) {
        console.error("Error fetching user by email:", error);
        res.status(500).json({ message: "Failed to fetch user", error: error.message });
      }
  }

  async getUserByEmail(req, res) {
      try {
          const { email } = req.query;
      
          if (!email) {
          return res.status(400).json({ message: "Email is required" });
          }
      
          const user = await User.findOne({ email });
      
          if (!user) {
          return res.status(404).json({ message: "User not found" });
          }
      
          const Model = models[user.role] || User;
          const fullUser = await Model.findById(user._id);
      
          res.status(200).json(fullUser);
      } catch (error) {
          console.error("Error fetching user by email:", error);
          res.status(500).json({ message: "Failed to fetch user", error: error.message });
      }
  }

  async getAllUsers(req, res) {
      try {
          const { role } = req.query;
      
          const filter = role ? { role } : {};
      
          const users = await User.find(filter);
      
          res.status(200).json(users);
      } catch (error) {
          console.error("Error fetching users:", error);
          res.status(500).json({ message: "Failed to fetch users" });
      }
  } 

  async getAllDoctors(req, res) {
    try {
      const users = await User.find({ role: 'specialist' });
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }
  
  async updateSpecialistApproval(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
  
      const specialist = await User.findById(id);
      if (!specialist) {
        return res.status(404).json({ message: 'Specialist not found' });
      }
  
      specialist.approvalStatus = status;
      await specialist.save();
  
      res.status(200).json({
        message: `Specialist ${status} successfully`,
        specialist,
      });
    } catch (error) {
      console.error('updateSpecialistApproval error:', error);
      res.status(500).json({ message: 'Failed to update specialist status', error: error.message });
    }
  }
      
}

module.exports = {
  UserController: new UserController()
};
