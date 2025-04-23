// controllers/UserController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const GeneralController = require('./GeneralController');
const User = require('../../models/medicalTourism/User');
const crypto = require("crypto");
const sendEmail = require("../../utils/medicalTourism/sendEmail");
const generateOTP = require("../../utils/medicalTourism/generateOTP");

const fs = require('fs');
const path = require('path');

// Role-specific models
const Specialist = require('../../models/medicalTourism/SpecialistUser');
const Patient = require('../../models/medicalTourism/UserDefault');
const Consultant = require('../../models/medicalTourism/ConsultantUser');
const Admin = require('../../models/medicalTourism/AdminUser');

const models = {
  specialist: Specialist,
  patient: Patient,
  consultant: Consultant,
  admin: Admin
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
      const { email, password, role } = req.body;
  
      console.log("register hit");
      console.log(req.body);
  
      if (!email || !password || !role) {
        return res.status(400).json({
          message: "Email, password, and role are required",
        });
      }
  
      const existingUser = await User.findOne({ email });
  
      if (existingUser) {
        if (!existingUser.isEmailVerified) {
          // Regenerate OTP and update user
          const otp = generateOTP();
          const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  
          existingUser.otp = otp;
          existingUser.otpExpires = otpExpires;
          await existingUser.save();
  
          await sendEmail(email, "Verify your account", otp);
  
          return res.status(200).json({
            message:
              "Email already registered but not verified. OTP resent to your email.",
          });
        }
  
        return res.status(400).json({ message: "Email already registered" });
      }
  
      // New user registration
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const Model = models[role] || User;
      const newUser = await Model.create({
        email,
        password: hashedPassword,
        role,
        otp,
        otpExpires,
      });
  
      await sendEmail(email, "Verify your account", `Your OTP is: ${otp}`);
  
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
    const { email, otp } = req.body;
  
    const user = await User.findOne({ email, otp, otpExpires: { $gt: new Date() } });
  
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
  
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
  
    const Model = models[user.role] || User;
    const fullUser = await Model.findById(user._id);
  
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
  
    res.status(200).json({
      message: "Email verified successfully",
      token,
      user: fullUser,
      redirectTo: user.isProfileComplete ? "dashboard" : "complete-profile"
    });
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
  
      // If no user found, return an error
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Generate a new OTP
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
  
      // Update user with new OTP and expiration
      user.otp = otp;
      user.otpExpires = otpExpires;
  
      // Save the updated user
      await user.save();
  
      // Send the new OTP to the user's email
      await sendEmail(email, "Verify your account", `Your new OTP is: ${otp}`);
  
      // Return a success message
      res.status(200).json({
        message: "OTP has been resent to your email",
      });
    } catch (error) {
      console.error("Error resending OTP:", error);
      res.status(500).json({ message: "Error resending OTP", error: error.message });
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

  async getAllUsers(req, res) {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }
}

module.exports = {
  UserController: new UserController()
};
