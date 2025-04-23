const GeneralController = require('./GeneralController');
const Booking = require('../../models/medicalTourism/Booking');

class BookingController extends GeneralController {
    constructor() {
        super(Booking);
    }

    async bookPackage(req, res){
        try {
            const { packageId, patientId } = req.body;
            const newBooking = new Booking({ packageId, patientId, status: 'Pending' });
            await newBooking.save();
            res.status(201).json({ message: 'Booking successful', newBooking });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    };
    
    async updateBooking(req, res){
        try {
            const { id } = req.params;
            const updatedBooking = await Booking.findByIdAndUpdate(id, req.body, { new: true });
            res.status(200).json({ message: 'Booking updated', updatedBooking });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    };
    
    async cancelBooking(req, res) {
        try {
            const { id } = req.params;
    
            const booking = await Booking.findById(id);
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
    
            booking.status = 'canceled'; // Update status to 'canceled'
            booking.canceledAt = new Date(); // Optional: Track cancellation time
    
            await booking.save();
    
            res.status(200).json({ message: 'Booking canceled successfully', booking });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    } 
}

module.exports = {
    BookingController: new BookingController()
};
