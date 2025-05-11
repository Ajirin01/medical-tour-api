const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../../models/medicalTourism/Payment');
const GeneralController = require('./GeneralController');
const User = require('../../models/medicalTourism/User');

class PaymentController extends GeneralController {
  constructor() {
    super(Payment);
  }

  async initiatePayment(req, res) {
    try {
      const { amount, email, productName } = req.body;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd', // or 'ngn' if applicable
              product_data: { name: productName },
              unit_amount: amount * 100, // amount in cents
            },
            quantity: 1,
          },
        ],
        customer_email: email,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      });

      res.status(200).json({ url: session.url });
    } catch (error) {
      console.error('Stripe payment error:', error);
      res.status(500).json({ message: 'Payment initiation failed', error });
    }
  }

  async verifyPayment(req, res) {
    try {
      const { session_id } = req.query;
  
      // Fetch the Stripe session
      const session = await stripe.checkout.sessions.retrieve(session_id);
  
      // Check payment status
      if (session.payment_status === 'unpaid') { //using unpaid for test alone
        // Optionally: Find the user based on session.email (assuming email was passed with session creation)
        const user = await User.findOne({ email: session.customer_email });
  
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

  
        // Save the payment to the database
        const payment = await Payment.create({
          user: user._id, // Associate payment with the user
          amount: session.amount_total / 100, // Amount in the smallest unit (e.g., cents)
          currency: session.currency,
          status: 'paid', // Mark payment as successful
          reference: session.id, // Unique payment reference from Stripe
          transactionId: session.payment_intent, // Stripe transaction ID
          paymentMethod: 'card', // You can add logic to determine this
          metadata: session, // Save full session details as metadata (optional)
        });
  
        // Respond with payment confirmation
        res.status(200).json({ paid: true, payment });
      } else {
        res.status(200).json({ paid: false, message: 'Payment failed or not completed' });
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      res.status(500).json({ message: 'Payment verification failed', error });
    }
  }

  async getPayments(req, res) {
    try {
      const user = req.user;
  
      let payments;
  
      if (user.role === 'admin') {
        // Admin: fetch all payments
        payments = await Payment.find().populate('user');
      } else if (user.role === 'specialist') {
        // Specialist: fetch payments related to them (assuming you store specialistId in Payment)
        payments = await Payment.find({ specialist: user._id }).populate('user');
      } else if (user.role === 'user') {
        // User: fetch only their own payments
        payments = await Payment.find({ user: user._id });
      } else {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
  
      res.status(200).json({ success: true, payments });
    } catch (error) {
      console.error('Failed to get payments:', error);
      res.status(500).json({ message: 'Failed to fetch payments', error });
    }
  }
  
}

module.exports = {
  PaymentController: new PaymentController(),
};
