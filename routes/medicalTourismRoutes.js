const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { protect, authorize, ensureQuestionsAnswered } = require('../middlewares/authMiddleware');

// Import all controllers (each extends GeneralController)
const { BookingController } = require('../controllers/medicalTourism/bookingController');
const { ConsultationAppointmentController } = require('../controllers/medicalTourism/consultationAppointmentController');
const { ConsultationDocumentationController } = require('../controllers/medicalTourism/consultationDocumentationController');
const { InvoiceController } = require('../controllers/medicalTourism/invoiceController');
const { LabResultController } = require('../controllers/medicalTourism/labResultController');
const { LabServiceController } = require('../controllers/medicalTourism/labServiceController');
const { LaboratoryController } = require('../controllers/medicalTourism/laboratoryController');
const { MedicalTourismPackageController } = require('../controllers/medicalTourism/medicalTourismPackageController');
const { MedicationController } = require('../controllers/medicalTourism/medicationController');
const { OrderController } = require('../controllers/medicalTourism/orderController');
const { PaymentController } = require('../controllers/medicalTourism/paymentController');
const { PharmacyController } = require('../controllers/medicalTourism/pharmacyController');
const { CartController } = require('../controllers/medicalTourism/cartController');
const { HospitalController } = require('../controllers/medicalTourism/hospitalController');
const { HospitalServiceController } = require('../controllers/medicalTourism/hospitalServiceController');
const { PrescriptionController } = require("../controllers/medicalTourism/PrescriptionController");
const { BrandController } = require('../controllers/medicalTourism/brandController');
const { CategoryController } = require('../controllers/medicalTourism/categoryController');
const { UserController } = require('../controllers/medicalTourism/userController');
const { ShippingAddressController } = require('../controllers/medicalTourism/shippingAddressController');
const { HealthQuestionnaireController } = require('../controllers/medicalTourism/healthQuestionnaireController');
const { AvailabilityController } = require('../controllers/medicalTourism/availabilityController');
const { PushNotificationController } = require('../controllers/medicalTourism/pushNotificationController');
const { VideoSessionController } = require('../controllers/medicalTourism/videoSessionController');
const { GalleryController } = require('../controllers/medicalTourism/galleryController');
const { BlogController } = require('../controllers/medicalTourism/blogController');
const { ChatbotController } = require('../controllers/medicalTourism/ChatbotController');
const { MedicalCertificateController } = require('../controllers/medicalTourism/MedicalCertificateController');


const routeGroup = (prefix, controller, extraRoutes = []) => {
    const commonRoutes = [
      {
        method: 'get',
        path: '/',
        handlerName: 'getAll',
        middlewares: [],
      },
      {
        method: 'get',
        path: '/:id',
        handlerName: 'getOne',
        middlewares: [],
      },
      {
        method: 'post',
        path: '/',
        handlerName: 'create',
        middlewares: [protect, authorize(['admin', 'superAdmin', 'specialist', 'consultant', 'pharmacyAdmin', 'labAdmin'])],
      },
      {
        method: 'put',
        path: '/:id',
        handlerName: 'update',
        middlewares: [protect, authorize(['admin', 'superAdmin', 'specialist', 'consultant', 'pharmacyAdmin', 'labAdmin'])],
      },
      {
        method: 'delete',
        path: '/:id',
        handlerName: 'delete',
        middlewares: [protect, authorize(['admin', 'superAdmin', 'specialist', 'consultant', 'pharmacyAdmin', 'labAdmin'])],
      },
    ];
  
    // Register only if the method exists on the controller
    commonRoutes.forEach(({ method, path, handlerName, middlewares }) => {
      const handler = controller[handlerName];
      if (typeof handler === 'function') {
        router[method](`${prefix}${path}`, ...middlewares, handler);
      }
    });
  
    // Register extraRoutes
    extraRoutes.forEach(([method, path, middlewares, handler]) => {
      router[method](`${prefix}${path}`, ...middlewares, handler);
    });
  };
  

// 📌 Booking Routes (User & Specialist can book, Admin can manage)
routeGroup('/booking', BookingController, [
    ['post', '/', [protect, authorize(['user', 'specialist'])], BookingController.create],
]);

// 📌 Consultation Routes (Specialist & Consultant Access)
routeGroup('/consultation-appointments', ConsultationAppointmentController, [
    ['get', '/get/all/simple', [], ConsultationAppointmentController.getAllSimple],
    ['post', '/create/custom', [protect, authorize(['admin', 'superAdmin', 'specialist', 'consultant', 'user'])], ConsultationAppointmentController.createCustom],
    ['put', '/update/custom/:id', [protect, authorize(['admin', 'superAdmin', 'specialist', 'consultant', 'user'])], ConsultationAppointmentController.updateCustom],
    ['get', '/all/paginated', [protect, authorize(['user', 'admin', 'superAdmin', 'specialist', 'consultant'])], ConsultationAppointmentController.getPaginatedWithUsers],
    ['get', '/all/no/pagination', [protect], ConsultationAppointmentController.getNoPaginate],
    ['get', '/get/custom/:id', [protect, authorize(['user', 'admin', 'superAdmin', 'specialist', 'consultant'])], ConsultationAppointmentController.getOneWithUsers]
]);
routeGroup('/consultation-documents', ConsultationDocumentationController, [
    ['post', '/create/custom', [protect, authorize(['admin', 'superAdmin', 'specialist', 'consultant']), upload.single('document')], ConsultationDocumentationController.createCustom],
    ['get', '/get/all/custom', [protect, authorize(['admin', 'superAdmin', 'consultant', 'specialist'])], ConsultationDocumentationController.getAllCustom],
    ['get', '/get/custom/:id', [protect, authorize(['admin', 'superAdmin', 'consultant', 'specialist'])], ConsultationDocumentationController.getOneCustom],
    ['put', '/update/custom/:id', [protect, authorize(['admin', 'superAdmin', 'specialist', 'consultant']), upload.single('document')], ConsultationDocumentationController.updateCustom],
    ['put', '/add/file/custom/:id', [protect, authorize(['admin', 'superAdmin', 'specialist', 'consultant']), upload.single('document')], ConsultationDocumentationController.addFile],
    ['post', '/delete/file/custom/:id', [protect, authorize(['admin', 'superAdmin', 'specialist', 'consultant']), upload.single('document')], ConsultationDocumentationController.deleteFile]
]);

// 📌 Invoices (Admin & Consultant Can Generate Invoices)
routeGroup('/invoice', InvoiceController, [
    ['post', '/', [protect, authorize(['admin', 'superAdmin', 'consultant'])], InvoiceController.create],
]);

// 📌 Laboratory (Lab Admin & Lab Employees Manage Lab)
routeGroup('/laboratories', LaboratoryController, [
    ['get', '/get-all/no-pagination', [], LaboratoryController.getAllLaboratories],

    ['put', '/custom/update/:id', [protect, authorize(['admin', 'superAdmin']), upload.single('license')], LaboratoryController.customUpdate],

    ['post', '/custom/create', [protect, authorize(['admin', 'labAdmin', 'superAdmin']), upload.single('license')], LaboratoryController.customCreate]
]);

// 📌 Laboratory Result (Lab Admin & Lab Employees Manage Lab Services)
routeGroup('/lab-results', LabResultController, [
    ['post', '/', [protect, authorize(['admin', 'specialist', 'user', 'superAdmin', 'labAdmin', 'labEmployee'])], LabResultController.create],

    ['get', '/get-all/no-pagination', [], LabResultController.getAllLabResults],

    ['put', '/custom/update/:id', [protect, authorize(['admin', 'superAdmin']), upload.single('resultFile')], LabResultController.customUpdate],

    ['post', '/custom/create', [protect, authorize(['admin', 'superAdmin']), upload.single('resultFile')], LabResultController.customCreate],

    // 🔍 File-based lab referrals (Admin only or delegated roles)
    ['get', '/referrals/get-all/no-pagination', [protect, authorize(['admin', 'superAdmin', 'labAdmin', 'specialist'])], LabResultController.getAllFileBasedReferrals],

    ['post', '/referrals', [protect, authorize(['admin', 'superAdmin', 'labAdmin', 'specialist']), upload.single('result')], LabResultController.createFileBasedReferral],

    ['put', '/referrals/:id', [protect, authorize(['admin', 'superAdmin', 'labAdmin', 'specialist']), upload.single('result')], LabResultController.updateFileBasedReferral],

    ['delete', '/referrals/:id', [protect, authorize(['admin', 'superAdmin', 'labAdmin', 'specialist'])], LabResultController.deleteFileBasedReferral],

    ['post', '/refer/send-to-lab', [protect, authorize(['doctor', 'admin', 'superAdmin', 'specialist'])], LabResultController.sendReferralToLab],
]);

routeGroup('/lab-services', LabServiceController, [
    ['post', '/', [protect, authorize(['admin', 'superAdmin','labAdmin'])], LabServiceController.create],
    ['get', '/get-all/no-pagination', [], LabServiceController.getAllLabServices],
]);

// 📌 Medical Tourism Packages (Only Admin Can Manage Packages)
routeGroup('/tour', MedicalTourismPackageController, [
    ['post', '/create/custom', [protect, authorize(['admin', 'superAdmin']), upload.single('photo')], MedicalTourismPackageController.createPackage],
    ['put', '/update/custom/:id', [protect, authorize(['admin', 'superAdmin']), upload.single('photo')], MedicalTourismPackageController.updatePackage],
    ['get', '/get-all/no-pagination', [], MedicalTourismPackageController.getAllPackages],
]);

// 📌 Medications & Pharmacy (Pharmacy Admin & Employees)
routeGroup('/products', MedicationController, [
    ['post', '/', [protect, authorize(['pharmacyAdmin'])], MedicationController.create],
    ['get', '/get-all/brand-category', [], MedicationController.getAllWithBrandAndCategory]
]);
routeGroup('/pharmacies', PharmacyController, [
    ['post', '/', [protect, authorize(['admin', 'superAdmin'])], PharmacyController.create],
    ['get', '/get-all/no-pagination', [], PharmacyController.getAllPharmacies],

    ['put', '/custom/update/:id', [protect, authorize(['admin', 'superAdmin']), upload.single('licenseFile')], PharmacyController.customUpdate],

    ['post', '/custom/create', [protect, authorize(['admin', 'superAdmin']), upload.single('licenseFile')], PharmacyController.customCreate]
]);
// 📌 Cart Routes (Users can manage their cart)
routeGroup('/cart', CartController, [
    ['get', '/get/all', [protect], CartController.getCart], // Get user's cart
    ['post', '/add/item', [protect], CartController.addItemToCart], // Add item to cart
    ['put', '/update/custom', [protect], CartController.updateCartItem], // Update cart item
    ['delete', '/remove/:cartItemId', [protect], CartController.removeItemFromCart], // Remove item from cart
    ['delete', '/clear', [protect], CartController.clearCart], // Clear cart

    // 📌 Routes for prescription linking/unlinking
    ['post', '/link-prescription', [protect], CartController.linkPrescription], // Link prescription
    ['post', '/unlink-prescription', [protect], CartController.unlinkPrescription], // Unlink prescription

    // 📌 New routes for prescription approval/rejection
    ['post', '/approve-prescription-link', [protect], CartController.approveCartPrescriptionLink], // Approve prescription link
    ['post', '/reject-prescription-link', [protect], CartController.rejectCartPrescriptionLink], // Reject prescription link

    ['get', '/linked-prescriptions/by/status', [protect, authorize(['admin', 'superAdmin'])], CartController.getPrescriptionsByStatus], // Get prescriptions by status

    ['put', '/update/linked-prescriptions', [protect, authorize(['admin', 'superAdmin'])], CartController.updateCartPrescriptionLinkStatus]
]);


// 📌 Orders (User Can Order, Pharmacy Admin Manages)
routeGroup('/orders', OrderController, [
    ['post', '/', [protect, authorize(['user', 'admin', 'superAdmin'])], OrderController.create],
    ['get', '/get/user/custom', [protect, authorize(['user', 'admin', 'superAdmin'])], OrderController.getOrdersByUser],
    ['get', '/filter/by', [protect, authorize(['user', 'admin', 'superAdmin'])], OrderController.getAllOrders],
    ['post', '/create/manual', [protect, authorize(['user', 'admin', 'superAdmin'])], OrderController.createOrderManually],
    ['get', '/custom/:id', [protect, authorize(['user', 'admin', 'superAdmin'])], OrderController.getOrderById],
]);

// 📌 Payments (All Users Can Initiate, Admin/Specialist/User Can View Their Payments)
routeGroup('/payments', PaymentController, [
  ['post', '/initiate', [protect, authorize(['user', 'specialist', 'admin', 'superAdmin', 'consultant'])], PaymentController.initiatePayment],
  ['get', '/verify/custom', [protect], PaymentController.verifyPayment],
  ['post', '/create/intent', [protect], PaymentController.createPaymentIntent],
  ['get', '/all/no-pagination', [protect, authorize(['user', 'specialist', 'admin', 'superAdmin'])], PaymentController.getPayments],
]);


// 📌 Hospitals & Services (Admin Only)
routeGroup('/hospitals', HospitalController, [
  ['post', '/custom/create', [protect, authorize(['admin', 'superAdmin']), upload.single('photo')], HospitalController.createCustom],
  ['put', '/custom/update/:id', [protect, authorize(['admin', 'superAdmin']), upload.single('photo')], HospitalController.updateCustom],
]);
routeGroup('/hospital-services', HospitalServiceController, [
    ['post', '/', [protect, authorize(['admin', 'superAdmin'])], HospitalServiceController.create],
]);

// 📌 Prescription Routes
routeGroup("/prescriptions", PrescriptionController, [
    ["post", "/upload", [protect, upload.single("file")], PrescriptionController.uploadPrescription], // Upload new prescription
    ["get", "/user/all", [protect], PrescriptionController.getUserPrescriptions], // Get user's prescriptions (last 24h)
    ["put", "/:id/status", [protect, authorize(["admin", "pharmacyAdmin"])], PrescriptionController.updatePrescriptionStatus], // Approve prescription
    ["put", "/reject/:id", [protect, authorize(["admin", "pharmacyAdmin"])], PrescriptionController.rejectPrescription], // Reject prescription
    ["delete", "/delete/custom/:id", [protect, authorize(["admin", "pharmacyAdmin"])], PrescriptionController.delete], // Reject prescription

    ["get", "/by/status", [protect, authorize(['admin', 'superAdmin'])], PrescriptionController.getPrescriptionsByStatus], // Get prescriptions by status
  ]);

// 📌 Brand Routes (Admin Only)
routeGroup('/brands', BrandController, [
    ['post', '/create', [protect, authorize(['admin', 'superAdmin']), upload.single('logo')],  BrandController.createBrand],
    ['put', '/update/:id', [protect, authorize(['admin', 'superAdmin']), upload.single('logo')],  BrandController.updateBrand],
    ['put', '/:id', [protect, authorize(['admin', 'superAdmin'])], BrandController.update],
    ['delete', '/:id', [protect, authorize(['admin', 'superAdmin'])], BrandController.delete],

    ['get', '/get-all/no-pagination', [], BrandController.getAllBrands],
]);

// 📌 Category Routes (Admin Only)
routeGroup('/categories', CategoryController, [
    ['post', '/', [protect, authorize(['admin', 'superAdmin'])], CategoryController.create],
    ['put', '/:id', [protect, authorize(['admin', 'superAdmin'])], CategoryController.update],
    ['delete', '/:id', [protect, authorize(['admin', 'superAdmin'])], CategoryController.delete],

    ['get', '/get-all/no-pagination', [], CategoryController.getAllCategories],
]);

// 📌 User Routes (Admin Only + Public Access Where Applicable)
routeGroup('/users', UserController, [
    // Admin-only route to get all users (no pagination)
    ['get', '/get-all/no-pagination', [protect, authorize(['admin', 'superAdmin', 'labAdmin', 'superadmin'])], UserController.getAllUsers],
    ['get', '/get-all/doctors/no-pagination', [], UserController.getAllDoctors],
  
    // Public routes
    ['post', '/register', [], UserController.register],
    ['post', '/otp/verify', [], UserController.verifyOtp],
    ['post', '/otp/resend', [], UserController.resendOtp],
    ['get', '/test/email', [], UserController.testEmail],
    ['post', '/login', [], UserController.login],
    ['get', '/get/by-email', [], UserController.getUserByEmail],

    // Forgot and Reset Password
    ['post', '/auth/forgot-password', [], UserController.forgotPassword],
    ['post', '/auth/reset-password', [], UserController.resetPassword],

    ['put', '/complete/profile', [
        protect,
        upload.fields([
          { name: 'profileImage', maxCount: 1 },
          { name: 'practicingLicense', maxCount: 1 },
          { name: 'signature', maxCount: 1 }
        ])
      ], UserController.completeProfile],
      
    // Authenticated user routes
    ['put', '/update/:id', [protect], UserController.updateUserInfo],
    // ['delete', '/delete/by', [protect, authorize(['admin', 'superAdmin'])], UserController.deleteUser],
    ['get', '/delete/by', [], UserController.deleteUser],
    ['put', '/:id/status', [protect, authorize(['admin', 'superAdmin'])], UserController.updateSpecialistApproval]
    
]);

// 📌 Shipping Address Routes (User can manage their shipping addresses)
routeGroup('/shipping-addresses', ShippingAddressController, [
    // Create a new shipping address
    ['post', '/', [protect], ShippingAddressController.createShippingAddress], // Requires user to be logged in
    
    // Get all shipping addresses for a specific user
    ['get', '/user/:userId', [protect], ShippingAddressController.getUserShippingAddresses], // Requires user to be logged in

    // Get a specific shipping address by ID
    ['get', '/custom/get', [protect], ShippingAddressController.getAllCustom], 

    // Get a specific shipping address by ID
    ['get', '/get/custom/:id', [protect], ShippingAddressController.getShippingAddressById], // Requires user to be logged in
    
    // Update a shipping address
    ['put', '/update/custom/:id', [protect], ShippingAddressController.updateShippingAddress], // Requires user to be logged in
    
    // Delete a shipping address
    ['delete', '/delete/custom/:id', [protect], ShippingAddressController.deleteShippingAddress], // Requires user to be logged in
]);

routeGroup('/health-questionnaires', HealthQuestionnaireController, [
    ['get', '/user/:userId', [protect], HealthQuestionnaireController.getByUser],
    ['post', '/create/custom', [protect], HealthQuestionnaireController.createCustom]
]);

// 📌 Availability Routes
routeGroup('/availabilities', AvailabilityController, [
    // Custom create to prevent overlaps
    ['post', '/create/custom', [protect, authorize(['specialist', 'consultant'])], AvailabilityController.createCustom],
  
    // Get all availability slots for a specific user
    ['get', '/user/:userId', [protect], AvailabilityController.getByUser],
    ['get', '/slots/by', [protect], AvailabilityController.getByRole]
  ]);

routeGroup('/push-notifications', PushNotificationController, [
    // Subscribe to notifications
    ['post', '/subscribe', [protect], PushNotificationController.subscribe],
    
    // Send push notifications
    ['post', '/send', [], PushNotificationController.sendNotification],
    
    // Get all notifications
    ['get', '/all', [protect], PushNotificationController.getAllNotifications],
    
    // Get a specific notification by ID
    ['get', '/:id', [protect], PushNotificationController.getOneNotification],
]);

routeGroup('/video-sessions', VideoSessionController, [
    // Create a session (after payment)
    ['post', '/', [protect, authorize(['admin', 'superAdmin', 'consultant', 'specialist'])], VideoSessionController.createSession],
  
    ['get', '/:id', [protect], VideoSessionController.getSessionById],

    ['put', '/:id', [protect], VideoSessionController.updateSession],

    ['get', '/by-appointment/:appointmentId', [protect], VideoSessionController.getSessionByAppointment],

    ['get', '/by-user/all', [protect], VideoSessionController.getUserSessions],

    // Get prescriptions from a session
    ['get', '/:sessionId/prescriptions', [protect], VideoSessionController.getPrescriptionsBySession],

    // Get prescriptions for a user
    ['get', '/by-user/:userId/prescriptions', [protect], VideoSessionController.getPrescriptionsByUser],

    // Get prescriptions for a specialist
    ['get', '/by-specialist/:specialistId/prescriptions', [protect], VideoSessionController.getPrescriptionsBySpecialist],
  
    ['get', '/get/all/paginated', [protect], VideoSessionController.getPaginatedSessions],

    // ✅ Lab Referrals (Embedded)
    ['get', '/lab-referrals/embedded', [protect], VideoSessionController.getAllEmbeddedLabReferrals],
    ['get', '/lab-referrals/session/:sessionId', [protect], VideoSessionController.getEmbeddedLabReferralsBySession],
    ['post', '/lab-referrals/session/:sessionId', [protect, authorize(['admin', 'superAdmin', 'labAdmin', 'specialist'])], VideoSessionController.addLabReferralToSession],
    ['get', '/by-user/:userId/lab-referrals', [protect], VideoSessionController.getLabReferralsByUser],
    ['get', '/by-specialist/:specialistId/lab-referrals', [protect], VideoSessionController.getLabReferralsBySpecialist],
  ]);
  
  routeGroup('/session-feedback', VideoSessionController, [
    // Add feedback for a session
    ['post', '/', [protect, authorize(['user'])], VideoSessionController.addFeedback],
  
    // Get feedback by session ID
    ['get', '/:sessionId', [protect, authorize(['admin', 'superAdmin'])], VideoSessionController.getFeedbackBySession],

    ['get', '/get/all/paginated', [protect], VideoSessionController.getPaginatedFeedbacks],

    ['get', '/all/no-pagination', [protect], VideoSessionController.getFeedbacksNoPagination],
  ]);

routeGroup('/galleries', GalleryController, [
  ['post', '/custom/create', [protect, authorize(['admin', 'superAdmin']), upload.single('photo')], GalleryController.createCustom],

  ['put', '/custom/update/:id', [protect, authorize(['admin', 'superAdmin']), upload.single('photo')], GalleryController.updateCustom],

  ['get', '/get-all/no-pagination', [], GalleryController.getAllNoPagination],

]);

routeGroup('/blogs', BlogController, [
  // Override create
  ['post', '/custom/create', [protect, authorize(['admin', 'superAdmin']), upload.single('featuredImage')], BlogController.createCustom],

  // Override update
  ['put', '/custom/update/:id', [protect, authorize(['admin', 'superAdmin']), upload.single('featuredImage')], BlogController.updateCustom],
]);

routeGroup('/chatbot', ChatbotController, [
  // Predict disease based on symptoms or question
  ['post', '/predict_disease', [], ChatbotController.predictDisease],
]);

// Medical Cerificate Routes
routeGroup('/certificates', MedicalCertificateController, [
  // Create Certificate with QR generation
  ['post', '/create', [protect, authorize(['specialist', 'admin'])], MedicalCertificateController.createCertificate],

  // Update certificate details (diagnosis/comment)
  ['put', '/update/:id', [protect, authorize(['specialist', 'admin'])], MedicalCertificateController.updateCertificate],

  // Get certificate by ID
  ['get', '/custom/get/:id', [protect, authorize(['specialist', 'admin'])], MedicalCertificateController.getCertificateByID],

  // Get certificate by certID
  ['get', '/get/by/:certID', [], MedicalCertificateController.getCertificateByCertID],

  // Get all certificates (admin only)
  ['get', '/get-all/no-pagination', [protect, authorize(['admin'])], MedicalCertificateController.getAllCertificates],

]);



module.exports = router;
