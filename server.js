const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5001;

// Initialize SQLite DB
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) return console.error('DB Error:', err.message);
  db.run(`CREATE TABLE IF NOT EXISTS tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timestamp DATETIME NOT NULL
  )`, (err) => err ? console.error('Table Error:', err) : console.log('DB Ready'));
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoints
app.post('/api/gps', (req, res) => {
  const { latitude, longitude, timestamp } = req.body;
  if (!latitude || !longitude) return res.status(400).json({ error: 'Missing coordinates' });
  
  db.run(`INSERT INTO tracking VALUES (?,?,?,?,?)`, [
    null, 'A74', latitude, longitude, timestamp || new Date().toISOString()
  ], (err) => err ? res.status(500).json({ error: 'DB Error' }) : res.json({ success: true }));
});

// Serve frontend
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));