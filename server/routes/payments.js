const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const DB_PATH = path.join(__dirname, '../../database.sqlite');

// Create payment intent (Stripe)
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', customerName, email } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        customerName,
        email
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Payment intent creation failed' });
  }
});

// Process payment
router.post('/process', async (req, res) => {
  const { 
    amount, 
    method, 
    customerName, 
    email, 
    cardNumber, 
    stripePaymentId,
    pumpId,
    queueId,
    reservationId 
  } = req.body;

  if (!amount || !method || !customerName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = new sqlite3.Database(DB_PATH);
  const paymentId = uuidv4();

  try {
    let status = 'completed';
    let processedStripeId = stripePaymentId;

    // For non-Stripe payments, simulate processing
    if (method === 'cash') {
      status = 'completed';
    } else if (method === 'digital') {
      // Simulate digital wallet processing
      status = Math.random() > 0.05 ? 'completed' : 'failed';
    } else if ((method === 'credit' || method === 'debit') && !stripePaymentId) {
      // Simulate card processing for demo
      status = Math.random() > 0.05 ? 'completed' : 'failed';
      processedStripeId = `sim_${paymentId}`;
    }

    // Save payment to database
    db.run(
      `INSERT INTO payments 
       (amount, method, customer_name, email, card_number, stripe_payment_id, status, pump_id, queue_id, reservation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        amount, 
        method, 
        customerName, 
        email, 
        cardNumber ? cardNumber.slice(-4) : null, // Only store last 4 digits
        processedStripeId,
        status,
        pumpId || null,
        queueId || null,
        reservationId || null
      ],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          db.close();
          return res.status(500).json({ error: 'Payment processing failed' });
        }

        // Update analytics
        if (status === 'completed') {
          const today = new Date().toISOString().split('T')[0];
          db.run(
            `UPDATE analytics 
             SET total_revenue = total_revenue + ?, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE date = ?`,
            [amount, today]
          );
        }

        db.close();
        res.json({
          success: status === 'completed',
          paymentId: this.lastID,
          status,
          message: status === 'completed' 
            ? 'Payment processed successfully' 
            : 'Payment failed'
        });
      }
    );
  } catch (error) {
    console.error('Payment processing error:', error);
    db.close();
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Get payment history
router.get('/history', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const db = new sqlite3.Database(DB_PATH);

  db.all(
    `SELECT * FROM payments 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)],
    (err, payments) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch payment history' });
      }
      res.json(payments);
    }
  );
});

// Get payment statistics
router.get('/stats', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  db.all(
    `SELECT 
       method,
       COUNT(*) as count,
       SUM(amount) as total_amount,
       AVG(amount) as avg_amount
     FROM payments 
     WHERE status = 'completed' 
       AND DATE(created_at) = DATE('now')
     GROUP BY method`,
    (err, stats) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Failed to fetch payment stats' });
      }

      // Get total revenue for today
      db.get(
        `SELECT 
           COUNT(*) as total_transactions,
           SUM(amount) as total_revenue
         FROM payments 
         WHERE status = 'completed' 
           AND DATE(created_at) = DATE('now')`,
        (err, totals) => {
          db.close();
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch payment totals' });
          }

          res.json({
            methodStats: stats,
            totals: totals || { total_transactions: 0, total_revenue: 0 }
          });
        }
      );
    }
  );
});

module.exports = router;