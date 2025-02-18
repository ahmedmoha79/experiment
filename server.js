const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 5001;

// Initialize SQLite DB
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('DB Connection Error:', err.message);
    return;
  }
  console.log('Connected to SQLite DB');

  // Create table if not exists (EXACTLY MATCH YOUR SCHEMA)
  db.run(`
    CREATE TABLE IF NOT EXISTS tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp DATETIME NOT NULL
    )
  `, (err) => {
    if (err) console.error('Table Creation Error:', err.message);
    else console.log('Table "tracking" ready');
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// GPS Data Endpoint
app.post('/api/gps', (req, res) => {
  const { latitude, longitude, timestamp } = req.body;
  
  if (!latitude || !longitude) {
    console.log('Bad Data Received:', req.body);
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  db.run(
    `INSERT INTO tracking (vehicle_id, latitude, longitude, timestamp)
     VALUES (?, ?, ?, ?)`,
    ['A74', latitude, longitude, timestamp],
    function(err) {
      if (err) {
        console.error('INSERT Error:', err.message);
        return res.status(500).json({ error: 'Database failed' });
      }
      console.log('Data SAVED:', { 
        id: this.lastID, 
        latitude, 
        longitude, 
        timestamp 
      });
      res.json({ success: true });
    }
  );
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://192.168.216.58:${PORT}`);
});