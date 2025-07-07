const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { notifyReservationConfirmation } = require('../services/notificationService');

const router = express.Router();
const DB_PATH = path.join(__dirname, '../../database.sqlite');

// Get all reservations
router.get('/', (req, res) => {
  const { status, date } = req.query;
  const db = new sqlite3.Database(DB_PATH);

  let query = 'SELECT r.*, p.number as pump_number FROM reservations r LEFT JOIN pumps p ON r.pump_id = p.id';
  let params = [];
  let conditions = [];

  if (status) {
    conditions.push('r.status = ?');
    params.push(status);
  }

  if (date) {
    conditions.push('DATE(r.reservation_time) = ?');
    params.push(date);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY r.reservation_time ASC';

  db.all(query, params, (err, reservations) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch reservations' });
    }
    res.json(reservations);
  });
});

// Create new reservation
router.post('/', async (req, res) => {
  const {
    customer_name,
    fuel_type,
    phone_number,
    email,
    reservation_time,
    estimated_liters,
    total_amount
  } = req.body;

  if (!customer_name || !fuel_type || !phone_number || !email || !reservation_time || !estimated_liters || !total_amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate reservation time (must be in the future)
  const reservationDate = new Date(reservation_time);
  if (reservationDate <= new Date()) {
    return res.status(400).json({ error: 'Reservation time must be in the future' });
  }

  const db = new sqlite3.Database(DB_PATH);

  // Check for conflicts (same time slot)
  db.get(`
    SELECT COUNT(*) as conflict_count
    FROM reservations 
    WHERE DATE(reservation_time) = DATE(?)
      AND TIME(reservation_time) = TIME(?)
      AND fuel_type = ?
      AND status IN ('pending', 'confirmed')
  `, [reservation_time, reservation_time, fuel_type], (err, result) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to check for conflicts' });
    }

    if (result.conflict_count > 0) {
      db.close();
      return res.status(409).json({ error: 'Time slot already reserved' });
    }

    // Create reservation
    db.run(`
      INSERT INTO reservations 
      (customer_name, fuel_type, phone_number, email, reservation_time, estimated_liters, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [customer_name, fuel_type, phone_number, email, reservation_time, estimated_liters, total_amount],
    async function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Failed to create reservation' });
      }

      const reservationId = this.lastID;

      db.get('SELECT * FROM reservations WHERE id = ?', [reservationId], async (err, reservation) => {
        db.close();
        
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch created reservation' });
        }

        // Send confirmation notification
        try {
          await notifyReservationConfirmation(
            phone_number, 
            email, 
            customer_name, 
            reservation_time, 
            total_amount
          );
        } catch (notificationError) {
          console.error('Reservation notification error:', notificationError);
        }

        res.status(201).json(reservation);
      });
    });
  });
});

// Update reservation status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const db = new sqlite3.Database(DB_PATH);

  db.run(
    'UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Failed to update reservation status' });
      }

      if (this.changes === 0) {
        db.close();
        return res.status(404).json({ error: 'Reservation not found' });
      }

      db.get('SELECT * FROM reservations WHERE id = ?', [id], (err, reservation) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch updated reservation' });
        }
        res.json(reservation);
      });
    }
  );
});

// Assign pump to reservation
router.put('/:id/assign-pump', (req, res) => {
  const { id } = req.params;
  const { pump_id } = req.body;

  if (!pump_id) {
    return res.status(400).json({ error: 'Pump ID required' });
  }

  const db = new sqlite3.Database(DB_PATH);

  // Verify pump exists and is available
  db.get('SELECT * FROM pumps WHERE id = ? AND status = "available"', [pump_id], (err, pump) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to verify pump' });
    }

    if (!pump) {
      db.close();
      return res.status(404).json({ error: 'Pump not found or not available' });
    }

    // Update reservation
    db.run(
      'UPDATE reservations SET pump_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [pump_id, id],
      function(err) {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Failed to assign pump' });
        }

        if (this.changes === 0) {
          db.close();
          return res.status(404).json({ error: 'Reservation not found' });
        }

        // Update pump status
        db.run(
          'UPDATE pumps SET status = "occupied", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [pump_id],
          (err) => {
            if (err) {
              console.error('Error updating pump status:', err);
            }

            db.get(`
              SELECT r.*, p.number as pump_number 
              FROM reservations r 
              LEFT JOIN pumps p ON r.pump_id = p.id 
              WHERE r.id = ?
            `, [id], (err, reservation) => {
              db.close();
              if (err) {
                return res.status(500).json({ error: 'Failed to fetch updated reservation' });
              }
              res.json(reservation);
            });
          }
        );
      }
    );
  });
});

// Delete reservation
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = new sqlite3.Database(DB_PATH);

  db.run('DELETE FROM reservations WHERE id = ?', [id], function(err) {
    db.close();
    if (err) {
      return res.status(500).json({ error: 'Failed to delete reservation' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json({ message: 'Reservation deleted successfully' });
  });
});

// Get available time slots
router.get('/available-slots', (req, res) => {
  const { date, fuel_type } = req.query;

  if (!date || !fuel_type) {
    return res.status(400).json({ error: 'Date and fuel type required' });
  }

  const db = new sqlite3.Database(DB_PATH);

  // Get reserved time slots for the date and fuel type
  db.all(`
    SELECT TIME(reservation_time) as reserved_time
    FROM reservations 
    WHERE DATE(reservation_time) = ?
      AND fuel_type = ?
      AND status IN ('pending', 'confirmed')
  `, [date, fuel_type], (err, reservedSlots) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch reserved slots' });
    }

    // Generate all possible time slots (every 30 minutes from 8:00 to 20:00)
    const allSlots = [];
    for (let hour = 8; hour < 20; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    // Filter out reserved slots
    const reservedTimes = reservedSlots.map(slot => slot.reserved_time);
    const availableSlots = allSlots.filter(slot => !reservedTimes.includes(slot));

    res.json(availableSlots);
  });
});

// Get reservation statistics
router.get('/stats', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);

  db.all(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(total_amount) as total_revenue
    FROM reservations 
    WHERE DATE(reservation_time) >= DATE('now', '-7 days')
    GROUP BY status
  `, (err, stats) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to fetch reservation statistics' });
    }

    // Get daily breakdown
    db.all(`
      SELECT 
        DATE(reservation_time) as date,
        COUNT(*) as reservations_count,
        SUM(total_amount) as daily_revenue
      FROM reservations 
      WHERE DATE(reservation_time) >= DATE('now', '-7 days')
        AND status = 'completed'
      GROUP BY DATE(reservation_time)
      ORDER BY date DESC
    `, (err, dailyStats) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch daily statistics' });
      }

      res.json({
        by_status: stats,
        daily_breakdown: dailyStats
      });
    });
  });
});

module.exports = router;