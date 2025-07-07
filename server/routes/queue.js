const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { notifyQueuePosition, notifyTurn } = require('../services/notificationService');

const router = express.Router();
const DB_PATH = path.join(__dirname, '../../database.sqlite');

// Get current queue
router.get('/', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  db.all(`
    SELECT q.*, p.number as pump_number 
    FROM queue q
    LEFT JOIN pumps p ON q.pump_id = p.id
    WHERE q.status = 'waiting'
    ORDER BY 
      CASE WHEN q.priority = 'high' THEN 0 ELSE 1 END,
      q.arrival_time ASC
  `, (err, queue) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch queue' });
    }
    res.json(queue);
  });
});

// Add customer to queue
router.post('/', async (req, res) => {
  const { 
    customer_name, 
    fuel_type, 
    phone_number, 
    email, 
    priority = 'normal' 
  } = req.body;

  if (!customer_name || !fuel_type || !phone_number || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = new sqlite3.Database(DB_PATH);

  // Calculate estimated wait time
  db.get(`
    SELECT COUNT(*) as waiting_count
    FROM queue 
    WHERE fuel_type = ? AND status = 'waiting'
  `, [fuel_type], async (err, result) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to calculate wait time' });
    }

    const estimatedWaitTime = result.waiting_count * 5; // 5 minutes per customer

    // Insert into queue
    db.run(`
      INSERT INTO queue 
      (customer_name, fuel_type, phone_number, email, estimated_wait_time, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [customer_name, fuel_type, phone_number, email, estimatedWaitTime, priority], 
    async function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Failed to add to queue' });
      }

      const customerId = this.lastID;

      // Get position in queue
      db.get(`
        SELECT COUNT(*) + 1 as position
        FROM queue 
        WHERE fuel_type = ? 
          AND status = 'waiting'
          AND (
            (priority = 'high' AND ? = 'normal') OR
            (priority = ? AND arrival_time < (SELECT arrival_time FROM queue WHERE id = ?))
          )
      `, [fuel_type, priority, priority, customerId], async (err, positionResult) => {
        db.close();
        
        if (err) {
          console.error('Error calculating position:', err);
        }

        const position = positionResult ? positionResult.position : 1;

        // Send notifications
        try {
          await notifyQueuePosition(phone_number, email, customer_name, position, estimatedWaitTime);
        } catch (notificationError) {
          console.error('Notification error:', notificationError);
        }

        res.status(201).json({
          id: customerId,
          customer_name,
          fuel_type,
          phone_number,
          email,
          position,
          estimated_wait_time: estimatedWaitTime,
          priority,
          status: 'waiting'
        });
      });
    });
  });
});

// Remove customer from queue
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = new sqlite3.Database(DB_PATH);

  db.run('DELETE FROM queue WHERE id = ?', [id], function(err) {
    db.close();
    if (err) {
      return res.status(500).json({ error: 'Failed to remove from queue' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Customer not found in queue' });
    }
    res.json({ message: 'Customer removed from queue' });
  });
});

// Serve next customer
router.post('/serve-next/:pumpId', async (req, res) => {
  const { pumpId } = req.params;
  const db = new sqlite3.Database(DB_PATH);

  // Get pump info
  db.get('SELECT * FROM pumps WHERE id = ?', [pumpId], (err, pump) => {
    if (err || !pump) {
      db.close();
      return res.status(404).json({ error: 'Pump not found' });
    }

    // Find next customer for this fuel type
    db.get(`
      SELECT * FROM queue 
      WHERE fuel_type = ? AND status = 'waiting'
      ORDER BY 
        CASE WHEN priority = 'high' THEN 0 ELSE 1 END,
        arrival_time ASC
      LIMIT 1
    `, [pump.fuel_type], async (err, customer) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Failed to find next customer' });
      }

      if (!customer) {
        db.close();
        return res.status(404).json({ error: 'No customers waiting for this fuel type' });
      }

      // Update customer status and assign pump
      db.run(`
        UPDATE queue 
        SET status = 'served', pump_id = ?, served_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [pumpId, customer.id], async function(err) {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Failed to serve customer' });
        }

        // Update pump status to occupied
        db.run(`
          UPDATE pumps 
          SET status = 'occupied', estimated_time = 5, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [pumpId], async (err) => {
          db.close();
          
          if (err) {
            console.error('Error updating pump status:', err);
          }

          // Send notification to customer
          try {
            await notifyTurn(customer.phone_number, customer.email, customer.customer_name, pump.number);
          } catch (notificationError) {
            console.error('Turn notification error:', notificationError);
          }

          res.json({
            message: 'Customer served successfully',
            customer: {
              ...customer,
              status: 'served',
              pump_id: pumpId,
              pump_number: pump.number
            }
          });
        });
      });
    });
  });
});

// Update customer priority
router.put('/:id/priority', (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;

  if (!['normal', 'high'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  const db = new sqlite3.Database(DB_PATH);

  db.run(
    'UPDATE queue SET priority = ? WHERE id = ? AND status = "waiting"',
    [priority, id],
    function(err) {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Failed to update priority' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Customer not found or already served' });
      }
      res.json({ message: 'Priority updated successfully' });
    }
  );
});

// Get queue statistics
router.get('/stats', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);

  db.all(`
    SELECT 
      fuel_type,
      COUNT(*) as waiting_count,
      AVG(estimated_wait_time) as avg_wait_time,
      COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count
    FROM queue 
    WHERE status = 'waiting'
    GROUP BY fuel_type
  `, (err, stats) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to fetch queue statistics' });
    }

    // Get total served today
    db.get(`
      SELECT 
        COUNT(*) as total_served_today,
        AVG(julianday(served_at) - julianday(arrival_time)) * 24 * 60 as avg_actual_wait_time
      FROM queue 
      WHERE status = 'served' 
        AND DATE(served_at) = DATE('now')
    `, (err, totals) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch daily statistics' });
      }

      res.json({
        by_fuel_type: stats,
        daily_totals: totals || { total_served_today: 0, avg_actual_wait_time: 0 }
      });
    });
  });
});

module.exports = router;