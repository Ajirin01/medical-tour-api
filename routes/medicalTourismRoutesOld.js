const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { protect } = require('../middlewares/authMiddleware');

// Import all controllers (each extends GeneralController)
const { BookingController } = require('../controllers/medicalTourism/bookingController');
const { ConsultationAppointmentController } = require('../controllers/medicalTourism/consultationAppointmentController');
const { ConsultationDocumentationController } = require('../controllers/medicalTourism/consultationDocumentationController');
const { InvoiceController } = require('../controllers/medicalTourism/invoiceController');
const { LabResultController } = require('../controllers/medicalTourism/labResultController');
const { LabServiceController } = require('../controllers/medicalTourism/labServiceController');
const { MedicalTourismPackageController } = require('../controllers/medicalTourism/medicalTourismPackageController');
const { MedicationController } = require('../controllers/medicalTourism/medicationController');
const { OrderController } = require('../controllers/medicalTourism/orderController');
const { PaymentController } = require('../controllers/medicalTourism/paymentController');
const { PharmacyController } = require('../controllers/medicalTourism/pharmacyController');
const { HospitalController } = require('../controllers/medicalTourism/hospitalController');
const { HospitalServiceController } = require('../controllers/medicalTourism/hospitalServiceController');


const routeGroup = (prefix, controller, extraRoutes = []) => {
    const commonRoutes = [
        ['get', '/', [], controller.getAll],
        ['get', '/:id', [], controller.getOne],
        ['post', '/', [protect], controller.create],
        ['put', '/:id', [protect], controller.update],
        ['delete', '/:id', [protect], controller.delete],
    ];

    [...commonRoutes, ...extraRoutes].forEach(([method, path, middlewares, handler]) => {
        router[method](`${prefix}${path}`, ...middlewares, handler);
    });
};

// 📌 Booking Routes
routeGroup('/booking', BookingController);

// 📌 Consultation Routes
routeGroup('/consultation-appointments', ConsultationAppointmentController);
routeGroup('/consultation-documents', ConsultationDocumentationController, [
    ['post', '/', [protect, upload.single('file')], ConsultationDocumentationController.create],
]);

// 📌 Invoices
routeGroup('/invoice', InvoiceController);

// 📌 Laboratory
routeGroup('/lab-results', LabResultController);
routeGroup('/lab-services', LabServiceController);

// 📌 Medical Tourism Packages
routeGroup('/tour', MedicalTourismPackageController, [
    ['post', '/', [protect, upload.single('image')], MedicalTourismPackageController.create],
    ['put', '/:id', [protect, upload.single('image')], MedicalTourismPackageController.update],
]);

// 📌 Medications & Pharmacy
routeGroup('/products', MedicationController);
routeGroup('/pharmacy', PharmacyController);

// 📌 Orders
routeGroup('/orders', OrderController);

// 📌 Payments
routeGroup('/payments', PaymentController, [
    ['post', '/initiate', [protect], PaymentController.initiatePayment],
    ['get', '/verify/:reference', [], PaymentController.verifyPayment],
]);

// 📌 Hospitals & Services
routeGroup('/hospitals', HospitalController);
routeGroup('/hospital-services', HospitalServiceController);

module.exports = router;
