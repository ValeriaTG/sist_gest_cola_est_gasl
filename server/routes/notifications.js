const express = require('express');
const { 
  notifyQueuePosition, 
  notifyTurn, 
  notifyReservationConfirmation,
  saveNotification 
} = require('../services/notificationService');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const DB_PATH = path.join(__dirname, '../../database.sqlite');

// Send queue position notification
router.post('/queue-position', async (req, res) => {
  const { phoneNumber, email, customerName, position, estimatedTime } = req.body;

  if (!phoneNumber || !email || !customerName || !position) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await notifyQueuePosition(phoneNumber, email, customerName, position, estimatedTime);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Queue position notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send turn notification
router.post('/turn', async (req, res) => {
  const { phoneNumber, email, customerName, pumpNumber } = req.body;

  if (!phoneNumber || !email || !customerName || !pumpNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await notifyTurn(phoneNumber, email, customerName, pumpNumber);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Turn notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send reservation confirmation
router.post('/reservation-confirmation', async (req, res) => {
  const { phoneNumber, email, customerName, reservationTime, totalAmount } = req.body;

  if (!phoneNumber || !email || !customerName || !reservationTime || !totalAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await notifyReservationConfirmation(phoneNumber, email, customerName, reservationTime, totalAmount);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Reservation confirmation error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Get notification history
router.get('/history', (req, res) => {
  const { limit = 50, offset = 0, type } = req.query;
  const db = new sqlite3.Database(DB_PATH);

  let query = 'SELECT * FROM notifications';
  let params = [];

  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, notifications) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
    res.json(notifications);
  });
});

// Get notification statistics
router.get('/stats', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);

  db.all(`
    SELECT 
      type,
      status,
      COUNT(*) as count
    FROM notifications 
    WHERE DATE(created_at) = DATE('now')
    GROUP BY type, status
  `, (err, stats) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to fetch notification stats' });
    }

    // Get total counts
    db.all(`
      SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM notifications 
      WHERE DATE(created_at) = DATE('now')
    `, (err, totals) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch notification totals' });
      }

      res.json({
        stats,
        totals: totals[0] || { total_sent: 0, successful: 0, failed: 0 }
      });
    });
  });
});

module.exports = router;