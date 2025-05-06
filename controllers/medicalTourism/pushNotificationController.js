const webpush = require('web-push');
const { v4: uuidv4 } = require('uuid');
const PushSubscription = require('../../models/medicalTourism/PushSubscription');

class PushNotificationController {
  constructor() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    webpush.setVapidDetails(
      'mailto:mubarakolagoke@gmail.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    this.sentNotifications = [];

    this.subscribe = this.subscribe.bind(this);
    this.sendNotification = this.sendNotification.bind(this);
    this.getAllNotifications = this.getAllNotifications.bind(this);
    this.getOneNotification = this.getOneNotification.bind(this);
  }

  handleError(res, message, status = 500) {
    res.status(status).json({ success: false, message });
  }

  async subscribe(req, res) {
    try {
      const subscription = req.body;

      if (!subscription || !subscription.endpoint) {
        return this.handleError(res, 'Invalid subscription object.', 400);
      }

      const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
      if (!existing) {
        await PushSubscription.create(subscription);
      }

      res.status(201).json({ success: true, message: 'Subscribed successfully' });
    } catch (error) {
      console.error('Error during subscription:', error);
      this.handleError(res, 'Failed to subscribe user.');
    }
  }

  async sendNotification(req, res) {
    const { title, body } = req.body;
    
    console.log("Hello")
  
    if (!title || !body) {
      return this.handleError(res, 'Title and body are required.', 400);
    }
  
    const payload = {
      id: uuidv4(),
      title,
      body,
      timestamp: new Date().toISOString(),
    };

  
    try {
      const subscriptions = await PushSubscription.find();
      const results = [];
  
      for (const subscription of subscriptions) {
        try {
          // Send the notification with the payload directly (no need to stringify)
          await webpush.sendNotification(subscription, JSON.stringify(payload));
          results.push({ success: true });
        } catch (error) {
          console.error('Push error:', error.message);
          results.push({ success: false, error: error.message });
  
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Remove invalid subscription
            await PushSubscription.deleteOne({ endpoint: subscription.endpoint });
          }
        }
      }
  
    //   console.log(payload)
      this.sentNotifications.push(payload);
  
      res.status(200).json({ success: true, results, notification: payload });
    } catch (error) {
      console.error('Error sending notifications:', error);
      this.handleError(res, 'Failed to send notifications.');
    }
  }
  

  async getAllNotifications(req, res) {
    try {
      res.status(200).json({ success: true, notifications: this.sentNotifications });
    } catch (error) {
      this.handleError(res, 'Failed to fetch notifications.');
    }
  }

  async getOneNotification(req, res) {
    try {
      const id = req.params.id;
      const notification = this.sentNotifications.find(n => n.id === id);

      if (!notification) {
        return this.handleError(res, 'Notification not found', 404);
      }

      res.status(200).json({ success: true, notification });
    } catch (error) {
      this.handleError(res, 'Failed to fetch notification.');
    }
  }
}

module.exports = { PushNotificationController: new PushNotificationController() };
