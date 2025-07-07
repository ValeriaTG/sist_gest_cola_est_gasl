const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const DB_PATH = path.join(__dirname, '../../database.sqlite');

// Get comprehensive analytics
router.get('/', (req, res) => {
  const { period = '7d' } = req.query;
  
  let dateFilter;
  switch (period) {
    case '1d':
      dateFilter = "DATE('now')";
      break;
    case '7d':
      dateFilter = "DATE('now', '-7 days')";
      break;
    case '30d':
      dateFilter = "DATE('now', '-30 days')";
      break;
    default:
      dateFilter = "DATE('now', '-7 days')";
  }

  const db = new sqlite3.Database(DB_PATH);

  // Get revenue analytics
  db.get(`
    SELECT 
      SUM(amount) as total_revenue,
      COUNT(*) as total_transactions,
      AVG(amount) as avg_transaction_amount
    FROM payments 
    WHERE status = 'completed' 
      AND DATE(created_at) >= ${dateFilter}
  `, (err, revenueData) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }

    // Get customer analytics
    db.get(`
      SELECT 
        COUNT(*) as total_customers_served,
        AVG(julianday(served_at) - julianday(arrival_time)) * 24 * 60 as avg_wait_time,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_customers
      FROM queue 
      WHERE status = 'served' 
        AND DATE(served_at) >= ${dateFilter}
    `, (err, customerData) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Failed to fetch customer analytics' });
      }

      // Get pump efficiency
      db.all(`
        SELECT 
          p.id,
          p.number,
          p.fuel_type,
          COUNT(q.id) as customers_served,
          AVG(julianday(q.served_at) - julianday(q.arrival_time)) * 24 * 60 as avg_service_time,
          SUM(pay.amount) as pump_revenue
        FROM pumps p
        LEFT JOIN queue q ON p.id = q.pump_id AND q.status = 'served' AND DATE(q.served_at) >= ${dateFilter}
        LEFT JOIN payments pay ON p.id = pay.pump_id AND pay.status = 'completed' AND DATE(pay.created_at) >= ${dateFilter}
        GROUP BY p.id, p.number, p.fuel_type
        ORDER BY p.number
      `, (err, pumpData) => {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Failed to fetch pump analytics' });
        }

        // Get hourly distribution
        db.all(`
          SELECT 
            strftime('%H', arrival_time) as hour,
            COUNT(*) as customer_count
          FROM queue 
          WHERE status = 'served' 
            AND DATE(served_at) >= ${dateFilter}
          GROUP BY strftime('%H', arrival_time)
          ORDER BY hour
        `, (err, hourlyData) => {
          if (err) {
            db.close();
            return res.status(500).json({ error: 'Failed to fetch hourly analytics' });
          }

          // Get fuel type distribution
          db.all(`
            SELECT 
              fuel_type,
              COUNT(*) as customer_count,
              SUM(pay.amount) as fuel_revenue
            FROM queue q
            LEFT JOIN payments pay ON q.id = pay.queue_id AND pay.status = 'completed'
            WHERE q.status = 'served' 
              AND DATE(q.served_at) >= ${dateFilter}
            GROUP BY fuel_type
          `, (err, fuelData) => {
            db.close();
            if (err) {
              return res.status(500).json({ error: 'Failed to fetch fuel analytics' });
            }

            res.json({
              period,
              revenue: revenueData || { total_revenue: 0, total_transactions: 0, avg_transaction_amount: 0 },
              customers: customerData || { total_customers_served: 0, avg_wait_time: 0, high_priority_customers: 0 },
              pumps: pumpData,
              hourly_distribution: hourlyData,
              fuel_distribution: fuelData
            });
          });
        });
      });
    });
  });
});

// Get real-time dashboard data
router.get('/dashboard', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);

  // Get current status
  db.all(`
    SELECT 
      (SELECT COUNT(*) FROM pumps WHERE status = 'available') as available_pumps,
      (SELECT COUNT(*) FROM pumps WHERE status = 'occupied') as occupied_pumps,
      (SELECT COUNT(*) FROM pumps WHERE status = 'maintenance') as maintenance_pumps,
      (SELECT COUNT(*) FROM queue WHERE status = 'waiting') as customers_waiting,
      (SELECT COUNT(*) FROM reservations WHERE status = 'confirmed' AND DATE(reservation_time) = DATE('now')) as todays_reservations,
      (SELECT SUM(amount) FROM payments WHERE status = 'completed' AND DATE(created_at) = DATE('now')) as todays_revenue,
      (SELECT COUNT(*) FROM queue WHERE status = 'served' AND DATE(served_at) = DATE('now')) as customers_served_today
  `, (err, currentStatus) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }

    // Get recent activity
    db.all(`
      SELECT 
        'queue' as type,
        customer_name as description,
        arrival_time as timestamp
      FROM queue 
      WHERE DATE(arrival_time) = DATE('now')
      UNION ALL
      SELECT 
        'payment' as type,
        'Payment of $' || amount || ' by ' || customer_name as description,
        created_at as timestamp
      FROM payments 
      WHERE status = 'completed' AND DATE(created_at) = DATE('now')
      UNION ALL
      SELECT 
        'reservation' as type,
        'Reservation by ' || customer_name as description,
        created_at as timestamp
      FROM reservations 
      WHERE DATE(created_at) = DATE('now')
      ORDER BY timestamp DESC
      LIMIT 10
    `, (err, recentActivity) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch recent activity' });
      }

      res.json({
        current_status: currentStatus[0] || {},
        recent_activity: recentActivity
      });
    });
  });
});

// Get performance metrics
router.get('/performance', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);

  // Calculate key performance indicators
  db.get(`
    SELECT 
      AVG(julianday(served_at) - julianday(arrival_time)) * 24 * 60 as avg_wait_time,
      COUNT(*) as total_served,
      COUNT(*) * 1.0 / (SELECT COUNT(DISTINCT DATE(served_at)) FROM queue WHERE status = 'served' AND DATE(served_at) >= DATE('now', '-7 days')) as avg_customers_per_day
    FROM queue 
    WHERE status = 'served' 
      AND DATE(served_at) >= DATE('now', '-7 days')
  `, (err, performance) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }

    // Calculate pump utilization
    db.all(`
      SELECT 
        p.number,
        p.fuel_type,
        COUNT(q.id) as times_used,
        AVG(julianday(q.served_at) - julianday(q.arrival_time)) * 24 * 60 as avg_service_time,
        (COUNT(q.id) * 1.0 / (SELECT COUNT(*) FROM queue WHERE status = 'served' AND DATE(served_at) >= DATE('now', '-7 days'))) * 100 as utilization_percentage
      FROM pumps p
      LEFT JOIN queue q ON p.id = q.pump_id AND q.status = 'served' AND DATE(q.served_at) >= DATE('now', '-7 days')
      GROUP BY p.id, p.number, p.fuel_type
      ORDER BY utilization_percentage DESC
    `, (err, pumpUtilization) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Failed to fetch pump utilization' });
      }

      // Calculate customer satisfaction score (simulated based on wait times)
      db.get(`
        SELECT 
          AVG(CASE 
            WHEN (julianday(served_at) - julianday(arrival_time)) * 24 * 60 <= 5 THEN 5
            WHEN (julianday(served_at) - julianday(arrival_time)) * 24 * 60 <= 10 THEN 4
            WHEN (julianday(served_at) - julianday(arrival_time)) * 24 * 60 <= 15 THEN 3
            WHEN (julianday(served_at) - julianday(arrival_time)) * 24 * 60 <= 20 THEN 2
            ELSE 1
          END) as satisfaction_score
        FROM queue 
        WHERE status = 'served' 
          AND DATE(served_at) >= DATE('now', '-7 days')
      `, (err, satisfaction) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: 'Failed to calculate satisfaction score' });
        }

        res.json({
          performance_metrics: performance || { avg_wait_time: 0, total_served: 0, avg_customers_per_day: 0 },
          pump_utilization: pumpUtilization,
          customer_satisfaction: satisfaction || { satisfaction_score: 0 }
        });
      });
    });
  });
});

// Get predictive analytics
router.get('/predictions', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);

  // Predict peak hours based on historical data
  db.all(`
    SELECT 
      strftime('%H', arrival_time) as hour,
      COUNT(*) as customer_count,
      AVG(COUNT(*)) OVER () as avg_hourly_customers
    FROM queue 
    WHERE status = 'served' 
      AND DATE(served_at) >= DATE('now', '-30 days')
    GROUP BY strftime('%H', arrival_time)
    ORDER BY customer_count DESC
  `, (err, peakHours) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to predict peak hours' });
    }

    // Predict maintenance needs based on usage
    db.all(`
      SELECT 
        p.id,
        p.number,
        p.fuel_type,
        COUNT(q.id) as usage_count,
        p.maintenance_date,
        CASE 
          WHEN p.maintenance_date IS NULL THEN 'HIGH'
          WHEN julianday('now') - julianday(p.maintenance_date) > 30 THEN 'HIGH'
          WHEN julianday('now') - julianday(p.maintenance_date) > 20 THEN 'MEDIUM'
          ELSE 'LOW'
        END as maintenance_priority
      FROM pumps p
      LEFT JOIN queue q ON p.id = q.pump_id AND q.status = 'served' AND DATE(q.served_at) >= DATE('now', '-30 days')
      GROUP BY p.id, p.number, p.fuel_type, p.maintenance_date
      ORDER BY maintenance_priority DESC, usage_count DESC
    `, (err, maintenancePredictions) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Failed to predict maintenance needs' });
      }

      // Predict daily revenue based on trends
      db.get(`
        SELECT 
          AVG(daily_revenue) as avg_daily_revenue,
          MAX(daily_revenue) as max_daily_revenue,
          MIN(daily_revenue) as min_daily_revenue
        FROM (
          SELECT 
            DATE(created_at) as date,
            SUM(amount) as daily_revenue
          FROM payments 
          WHERE status = 'completed' 
            AND DATE(created_at) >= DATE('now', '-30 days')
          GROUP BY DATE(created_at)
        )
      `, (err, revenueTrends) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: 'Failed to analyze revenue trends' });
        }

        res.json({
          peak_hours: peakHours.slice(0, 5), // Top 5 peak hours
          maintenance_predictions: maintenancePredictions,
          revenue_trends: revenueTrends || { avg_daily_revenue: 0, max_daily_revenue: 0, min_daily_revenue: 0 }
        });
      });
    });
  });
});

module.exports = router;