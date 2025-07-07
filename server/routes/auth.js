const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const DB_PATH = path.join(__dirname, '../../database.sqlite');

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const db = new sqlite3.Database(DB_PATH);
  
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        db.close();
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      try {
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
          db.close();
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            role: user.role,
            name: user.name 
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        db.close();
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            email: user.email
          }
        });
      } catch (error) {
        db.close();
        res.status(500).json({ error: 'Authentication error' });
      }
    }
  );
});

// Register (for customers)
router.post('/register', async (req, res) => {
  const { username, password, name, email, phone } = req.body;

  if (!username || !password || !name || !email) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const db = new sqlite3.Database(DB_PATH);

    db.run(
      `INSERT INTO users (username, password, role, name, email, phone) 
       VALUES (?, ?, 'customer', ?, ?, ?)`,
      [username, hashedPassword, name, email, phone],
      function(err) {
        if (err) {
          db.close();
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }

        const token = jwt.sign(
          { 
            id: this.lastID, 
            username, 
            role: 'customer',
            name 
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        db.close();
        res.status(201).json({
          token,
          user: {
            id: this.lastID,
            username,
            role: 'customer',
            name,
            email
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify token
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    res.json({ user });
  });
});

module.exports = router;