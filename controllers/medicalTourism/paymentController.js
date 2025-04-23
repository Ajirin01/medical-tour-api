const Flutterwave = require('flutterwave-node-v3');
const Payment = require('../../models/medicalTourism/Payment')
const GeneralController = require('./GeneralController');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

class PaymentController extends GeneralController {
    constructor() {
        super(Payment);
    }

    async initiatePayment(req, res) {
        try {
            const { amount, email } = req.body;
            const response = await flw.Charge.card({ amount, email, currency: 'NGN' });
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ message: 'Payment initiation failed', error });
        }
    };
    
    async verifyPayment(req, res) {
        try {
            const { reference } = req.params;
            const response = await flw.Transaction.verify({ id: reference });
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ message: 'Payment verification failed', error });
        }
    };


}

module.exports = {
    PaymentController: new PaymentController()
}
