require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// Define Schema & Model
const gpsSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  deviceName: String,  // Store device name
  timestamp: { type: Date, default: Date.now }
});
const GPS = mongoose.model('GPS', gpsSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint to Save GPS Data
app.post('/api/gps', async (req, res) => {
  const { latitude, longitude, deviceName } = req.body;
  if (!latitude || !longitude || !deviceName) 
    return res.status(400).json({ error: 'Missing coordinates or device name' });

  try {
    // Update existing record or create a new one
    const existingRecord = await GPS.findOneAndUpdate(
      { deviceName: deviceName },
      { latitude, longitude, timestamp: Date.now() },
      { new: true, upsert: true } // Create if not found
    );
    res.json({ success: true, record: existingRecord });
  } catch (err) {
    res.status(500).json({ error: 'DB Error' });
  }
});

// Serve Frontend
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
