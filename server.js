require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const UAParser = require('ua-parser-js');

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mohamedbeyhaqi:bQJx9JfwQNlJEXOE@cluster0.eu65h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// GPS Schema
const gpsSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  timestamp: { type: Date, default: Date.now },
  deviceInfo: {
    name: String,
    os: String,
    hardware: {
      gpu: String,
      memory: String,
      cores: String,
      screenResolution: String,
      pixelRatio: String,
      battery: {
        level: String,
        charging: String
      }
    }
  },
  rawData: {
    userAgent: String,
    payload: Object
  }
});

// GPS Model
const GPS = mongoose.model('GPS', gpsSchema);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route to handle GPS data
app.post('/api/gps', async (req, res) => {
  try {
    const { latitude, longitude, deviceId, deviceInfo } = req.body;

    // Create a new document or update the existing one
    const locationDoc = {
      deviceId,
      location: { latitude, longitude },
      deviceInfo: {
        name: deviceInfo.name,
        os: deviceInfo.os,
        hardware: {
          gpu: deviceInfo.hardware.gpu,
          memory: deviceInfo.hardware.memory,
          cores: deviceInfo.hardware.cores,
          screenResolution: deviceInfo.hardware.screenResolution,
          pixelRatio: deviceInfo.hardware.pixelRatio,
          battery: {
            level: deviceInfo.hardware.battery.level,
            charging: deviceInfo.hardware.battery.charging
          }
        }
      },
      rawData: {
        userAgent: req.headers['user-agent'],
        payload: req.body
      }
    };

    await GPS.findOneAndUpdate(
      { deviceId },
      locationDoc,
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to get all devices
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await GPS.find().sort({ timestamp: -1 });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Serve the main HTML file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
