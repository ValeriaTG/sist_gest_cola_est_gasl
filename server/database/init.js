const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../../database.sqlite');

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
    });

    // Create tables
    db.serialize(async () => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'customer',
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Pumps table
      db.run(`
        CREATE TABLE IF NOT EXISTS pumps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          number INTEGER UNIQUE NOT NULL,
          status TEXT NOT NULL DEFAULT 'available',
          fuel_type TEXT NOT NULL,
          estimated_time INTEGER DEFAULT 0,
          price_per_liter REAL NOT NULL,
          total_liters_today REAL DEFAULT 0,
          maintenance_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Queue table
      db.run(`
        CREATE TABLE IF NOT EXISTS queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_name TEXT NOT NULL,
          fuel_type TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          email TEXT NOT NULL,
          arrival_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          estimated_wait_time INTEGER DEFAULT 0,
          status TEXT DEFAULT 'waiting',
          priority TEXT DEFAULT 'normal',
          pump_id INTEGER,
          served_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pump_id) REFERENCES pumps (id)
        )
      `);

      // Reservations table
      db.run(`
        CREATE TABLE IF NOT EXISTS reservations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_name TEXT NOT NULL,
          fuel_type TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          email TEXT NOT NULL,
          reservation_time DATETIME NOT NULL,
          estimated_liters REAL NOT NULL,
          total_amount REAL NOT NULL,
          status TEXT DEFAULT 'pending',
          pump_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pump_id) REFERENCES pumps (id)
        )
      `);

      // Payments table
      db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          method TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          email TEXT NOT NULL,
          card_number TEXT,
          stripe_payment_id TEXT,
          status TEXT DEFAULT 'pending',
          pump_id INTEGER,
          queue_id INTEGER,
          reservation_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pump_id) REFERENCES pumps (id),
          FOREIGN KEY (queue_id) REFERENCES queue (id),
          FOREIGN KEY (reservation_id) REFERENCES reservations (id)
        )
      `);

      // Analytics table
      db.run(`
        CREATE TABLE IF NOT EXISTS analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date DATE NOT NULL,
          total_customers INTEGER DEFAULT 0,
          total_revenue REAL DEFAULT 0,
          average_wait_time REAL DEFAULT 0,
          customer_satisfaction REAL DEFAULT 0,
          pump_efficiency REAL DEFAULT 0,
          peak_hour INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(date)
        )
      `);

      // IoT Sensors table
      db.run(`
        CREATE TABLE IF NOT EXISTS iot_sensors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sensor_type TEXT NOT NULL,
          pump_id INTEGER,
          value REAL NOT NULL,
          unit TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pump_id) REFERENCES pumps (id)
        )
      `);

      // Notifications table
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          recipient TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          sent_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert default admin user
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || '1234', 10);
      db.run(`
        INSERT OR IGNORE INTO users (username, password, role, name, email)
        VALUES (?, ?, 'admin', 'Administrador del Sistema', 'admin@gasstation.com')
      `, [process.env.ADMIN_USERNAME || 'admin', hashedPassword]);

      // Insert default pumps
      const pumps = [
        [1, 'available', 'regular', 1.25],
        [2, 'occupied', 'premium', 1.45],
        [3, 'available', 'diesel', 1.35],
        [4, 'maintenance', 'regular', 1.25],
        [5, 'available', 'premium', 1.45],
        [6, 'occupied', 'diesel', 1.35]
      ];

      pumps.forEach(pump => {
        db.run(`
          INSERT OR IGNORE INTO pumps (number, status, fuel_type, price_per_liter)
          VALUES (?, ?, ?, ?)
        `, pump);
      });

      // Insert sample analytics data
      const today = new Date().toISOString().split('T')[0];
      db.run(`
        INSERT OR IGNORE INTO analytics (date, total_customers, total_revenue, average_wait_time, customer_satisfaction, pump_efficiency)
        VALUES (?, 147, 2847.50, 6.5, 4.2, 87)
      `, [today]);
    });

    db.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Database initialization completed');
      resolve();
    });
  });
}

module.exports = { initializeDatabase };