const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  createAppointment,
  getAppointments,
  updateAppointment,
  startAppointment
} = require('../controllers/appointmentController');

const router = express.Router();

router.post('/', protect, createAppointment);
router.get('/', protect, getAppointments);
router.put('/:id', protect, updateAppointment);
router.post('/:id/start', protect, startAppointment);

module.exports = router;
