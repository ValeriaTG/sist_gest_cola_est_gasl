const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const DB_PATH = path.join(__dirname, '../../database.sqlite');

// Get all pumps
router.get('/', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  db.all('SELECT * FROM pumps ORDER BY number', (err, pumps) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch pumps' });
    }
    res.json(pumps);
  });
});

// Get specific pump
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = new sqlite3.Database(DB_PATH);
  
  db.get('SELECT * FROM pumps WHERE id = ?', [id], (err, pump) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch pump' });
    }
    if (!pump) {
      return res.status(404).json({ error: 'Pump not found' });
    }
    res.json(pump);
  });
});

// Update pump status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, estimated_time } = req.body;

  if (!['available', 'occupied', 'maintenance'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const db = new sqlite3.Database(DB_PATH);
  
  db.run(
    'UPDATE pumps SET status = ?, estimated_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, estimated_time || 0, id],
    function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Failed to update pump status' });
      }

      if (this.changes === 0) {
        db.close();
        return res.status(404).json({ error: 'Pump not found' });
      }

      // Get updated pump
      db.get('SELECT * FROM pumps WHERE id = ?', [id], (err, pump) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch updated pump' });
        }
        res.json(pump);
      });
    }
  );
});

// Update pump maintenance
router.put('/:id/maintenance', (req, res) => {
  const { id } = req.params;
  const { maintenance_date } = req.body;

  const db = new sqlite3.Database(DB_PATH);
  
  db.run(
    'UPDATE pumps SET maintenance_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [maintenance_date, id],
    function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Failed to update maintenance date' });
      }

      if (this.changes === 0) {
        db.close();
        return res.status(404).json({ error: 'Pump not found' });
      }

      db.get('SELECT * FROM pumps WHERE id = ?', [id], (err, pump) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch updated pump' });
        }
        res.json(pump);
      });
    }
  );
});

// Get pump statistics
router.get('/:id/stats', (req, res) => {
  const { id } = req.params;
  const db = new sqlite3.Database(DB_PATH);

  // Get pump usage statistics
  db.all(`
    SELECT 
      DATE(q.served_at) as date,
      COUNT(*) as customers_served,
      AVG(julianday(q.served_at) - julianday(q.arrival_time)) * 24 * 60 as avg_service_time
    FROM queue q
    WHERE q.pump_id = ? 
      AND q.served_at IS NOT NULL
      AND DATE(q.served_at) >= DATE('now', '-7 days')
    GROUP BY DATE(q.served_at)
    ORDER BY date DESC
  `, [id], (err, stats) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to fetch pump statistics' });
    }

    // Get total revenue for this pump
    db.get(`
      SELECT 
        SUM(p.amount) as total_revenue,
        COUNT(p.id) as total_transactions
      FROM payments p
      WHERE p.pump_id = ?
        AND p.status = 'completed'
        AND DATE(p.created_at) >= DATE('now', '-7 days')
    `, [id], (err, revenue) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch pump revenue' });
      }

      res.json({
        usage_stats: stats,
        revenue_stats: revenue || { total_revenue: 0, total_transactions: 0 }
      });
    });
  });
});

module.exports = router;