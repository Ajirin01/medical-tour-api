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

const routeGroup = (prefix, controller, extraRoutes = []) => {
    const commonRoutes = [
        ['get', '/', [], controller.getAll],
        ['get', '/:id', [], controller.getOne],
        ['post', '/', [protect, authorize(['admin', 'specialist', 'consultant', 'pharmacyAdmin', 'labAdmin'])], controller.create],
        ['put', '/:id', [protect, authorize(['admin', 'specialist', 'consultant', 'pharmacyAdmin', 'labAdmin'])], controller.update],
        ['delete', '/:id', [protect, authorize(['admin', 'specialist', 'consultant', 'pharmacyAdmin', 'labAdmin'])], controller.delete],
    ];

    [...commonRoutes, ...extraRoutes].forEach(([method, path, middlewares, handler]) => {
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
    ['post', '/create/custom', [protect, authorize(['admin', 'specialist', 'consultant'])], ConsultationAppointmentController.createCustom],
    ['put', '/update/custom', [protect, authorize(['admin', 'specialist', 'consultant'])], ConsultationAppointmentController.updateCustom],
    ['get', '/all/paginated', [protect, authorize(['admin', 'specialist', 'consultant'])], ConsultationAppointmentController.getPaginatedWithUsers],
    ['get', '/get/custom/:id', [protect, authorize(['admin', 'specialist', 'consultant'])], ConsultationAppointmentController.getOneWithUsers]
]);
routeGroup('/consultation-documents', ConsultationDocumentationController, [
    ['post', '/create/custom', [protect, authorize(['admin', 'specialist', 'consultant']), upload.single('document')], ConsultationDocumentationController.createCustom],
    ['get', '/get/all/custom', [protect, authorize(['admin', 'consultant', 'specialist'])], ConsultationDocumentationController.getAllCustom],
    ['get', '/get/custom/:id', [protect, authorize(['admin', 'consultant', 'specialist'])], ConsultationDocumentationController.getOneCustom],
    ['put', '/update/custom/:id', [protect, authorize(['admin', 'specialist', 'consultant']), upload.single('document')], ConsultationDocumentationController.updateCustom],
    ['put', '/add/file/custom/:id', [protect, authorize(['admin', 'specialist', 'consultant']), upload.single('document')], ConsultationDocumentationController.addFile],
    ['post', '/delete/file/custom/:id', [protect, authorize(['admin', 'specialist', 'consultant']), upload.single('document')], ConsultationDocumentationController.deleteFile]
]);

// 📌 Invoices (Admin & Consultant Can Generate Invoices)
routeGroup('/invoice', InvoiceController, [
    ['post', '/', [protect, authorize(['admin', 'consultant'])], InvoiceController.create],
]);

// 📌 Laboratory (Lab Admin & Lab Employees Manage Lab)
routeGroup('/laboratories', LaboratoryController, [
    ['get', '/get-all/no-pagination', [], LaboratoryController.getAllLaboratories],

    ['put', '/custom/update/:id', [protect, authorize(['admin']), upload.single('resultFile')], LaboratoryController.customUpdate],

    ['post', '/custom/create', [protect, authorize(['admin']), upload.single('resultFile')], LaboratoryController.customCreate]
]);

// 📌 Laboratory (Lab Admin & Lab Employees Manage Lab Services)
routeGroup('/lab-results', LabResultController, [
    ['post', '/', [protect, authorize(['admin', 'labAdmin', 'labEmployee'])], LabResultController.create],

    ['get', '/get-all/no-pagination', [], LabResultController.getAllLabResults],

    ['put', '/custom/update/:id', [protect, authorize(['admin']), upload.single('resultFile')], LabResultController.customUpdate],

    ['post', '/custom/create', [protect, authorize(['admin']), upload.single('resultFile')], LabResultController.customCreate]
]);
routeGroup('/lab-services', LabServiceController, [
    ['post', '/', [protect, authorize(['admin','labAdmin'])], LabServiceController.create],
    ['get', '/get-all/no-pagination', [], LabServiceController.getAllLabServices],
]);

// 📌 Medical Tourism Packages (Only Admin Can Manage Packages)
routeGroup('/tour', MedicalTourismPackageController, [
    ['post', '/create/custom', [protect, authorize(['admin']), upload.single('photo')], MedicalTourismPackageController.createPackage],
    ['put', '/update/custom/:id', [protect, authorize(['admin']), upload.single('photo')], MedicalTourismPackageController.updatePackage],
    ['get', '/get-all/no-pagination', [], MedicalTourismPackageController.getAllPackages],
]);

// 📌 Medications & Pharmacy (Pharmacy Admin & Employees)
routeGroup('/products', MedicationController, [
    ['post', '/', [protect, authorize(['pharmacyAdmin'])], MedicationController.create],
    ['get', '/get-all/brand-category', [], MedicationController.getAllWithBrandAndCategory]
]);
routeGroup('/pharmacies', PharmacyController, [
    ['post', '/', [protect, authorize(['admin'])], PharmacyController.create],
    ['get', '/get-all/no-pagination', [], PharmacyController.getAllPharmacies],

    ['put', '/custom/update/:id', [protect, authorize(['admin']), upload.single('licenseFile')], PharmacyController.customUpdate],

    ['post', '/custom/create', [protect, authorize(['admin']), upload.single('licenseFile')], PharmacyController.customCreate]
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

    ['get', '/linked-prescriptions/by/status', [protect, authorize(['admin'])], CartController.getPrescriptionsByStatus], // Get prescriptions by status

    ['put', '/update/linked-prescriptions', [protect, authorize(['admin'])], CartController.updateCartPrescriptionLinkStatus]
]);


// 📌 Orders (User Can Order, Pharmacy Admin Manages)
routeGroup('/orders', OrderController, [
    ['post', '/', [protect, authorize(['user', 'admin'])], OrderController.create],
    ['get', '/get/user/custom', [protect, authorize(['user', 'admin'])], OrderController.getOrdersByUser],
    ['get', '/filter/by', [protect, authorize(['user', 'admin'])], OrderController.getAllOrders],
    ['post', '/create/manual', [protect, authorize(['user', 'admin'])], OrderController.createOrderManually],
    ['get', '/custom/:id', [protect, authorize(['user', 'admin'])], OrderController.getOrderById],
]);

// 📌 Payments (All Users Can Initiate, Admin Can Verify)
routeGroup('/payments', PaymentController, [
    ['post', '/initiate', [protect, authorize(['user', 'specialist', 'consultant'])], PaymentController.initiatePayment],
    ['get', '/verify/:reference', [protect, authorize(['admin'])], PaymentController.verifyPayment],
]);

// 📌 Hospitals & Services (Admin Only)
routeGroup('/hospitals', HospitalController, [
    ['post', '/', [protect, authorize(['admin'])], HospitalController.create],
]);
routeGroup('/hospital-services', HospitalServiceController, [
    ['post', '/', [protect, authorize(['admin'])], HospitalServiceController.create],
]);

// 📌 Prescription Routes
routeGroup("/prescriptions", PrescriptionController, [
    ["post", "/upload", [protect, upload.single("file")], PrescriptionController.uploadPrescription], // Upload new prescription
    ["get", "/user/all", [protect], PrescriptionController.getUserPrescriptions], // Get user's prescriptions (last 24h)
    ["put", "/:id/status", [protect, authorize(["admin", "pharmacyAdmin"])], PrescriptionController.updatePrescriptionStatus], // Approve prescription
    ["put", "/reject/:id", [protect, authorize(["admin", "pharmacyAdmin"])], PrescriptionController.rejectPrescription], // Reject prescription
    ["delete", "/delete/custom/:id", [protect, authorize(["admin", "pharmacyAdmin"])], PrescriptionController.delete], // Reject prescription

    ["get", "/by/status", [protect, authorize(['admin'])], PrescriptionController.getPrescriptionsByStatus], // Get prescriptions by status
  ]);

// 📌 Brand Routes (Admin Only)
routeGroup('/brands', BrandController, [
    ['post', '/create', [protect, authorize(['admin']), upload.single('logo')],  BrandController.createBrand],
    ['put', '/update/:id', [protect, authorize(['admin']), upload.single('logo')],  BrandController.updateBrand],
    ['put', '/:id', [protect, authorize(['admin'])], BrandController.update],
    ['delete', '/:id', [protect, authorize(['admin'])], BrandController.delete],

    ['get', '/get-all/no-pagination', [], BrandController.getAllBrands],
]);

// 📌 Category Routes (Admin Only)
routeGroup('/categories', CategoryController, [
    ['post', '/', [protect, authorize(['admin'])], CategoryController.create],
    ['put', '/:id', [protect, authorize(['admin'])], CategoryController.update],
    ['delete', '/:id', [protect, authorize(['admin'])], CategoryController.delete],

    ['get', '/get-all/no-pagination', [], CategoryController.getAllCategories],
]);

// 📌 User Routes (Admin Only + Public Access Where Applicable)
routeGroup('/users', UserController, [
    // Admin-only route to get all users (no pagination)
    ['get', '/get-all/no-pagination', [protect, authorize(['admin'])], UserController.getAllUsers],
  
    // Public routes
    ['post', '/register', [], UserController.register],
    ['post', '/otp/verify', [], UserController.verifyOtp],
    ['post', '/otp/resend', [], UserController.resendOtp],
    ['post', '/login', [], UserController.login],
    ['get', '/get/by-email', [], UserController.getUserByEmail],
    ['put', '/complete/profile', [
        protect,
        upload.fields([
          { name: 'profileImage', maxCount: 1 },
          { name: 'practicingLicense', maxCount: 1 }
        ])
      ], UserController.completeProfile],
      
    // Authenticated user routes
    ['patch', '/update/:id', [protect], UserController.updateUserInfo],
    ['get', '/delete/by', [], UserController.deleteUser]
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

module.exports = router;
