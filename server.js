require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const UAParser = require('ua-parser-js');

const app = express();
const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mohamedbeyhaqi:bQJx9JfwQNlJEXOE@cluster0.eu65h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

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
    architecture: String,
    hardware: {
      gpu: String,
      memory: String,
      cores: String,
      screenResolution: String,
      battery: String
    }
  },
  rawData: {
    userAgent: String,
    payload: Object
  }
});

const GPS = mongoose.model('GPS', gpsSchema);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/gps', async (req, res) => {
  try {
    const { latitude, longitude, deviceId, deviceInfo } = req.body;

    const serverParser = new UAParser(req.headers['user-agent']);
    const serverOS = serverParser.getOS();

    const finalDeviceInfo = {
      ...deviceInfo,
      serverDetectedOS: `${serverOS.name || 'Unknown'} ${serverOS.version || 'Unknown'}`,
    };

    const locationDoc = {
      deviceId,
      location: { latitude, longitude },
      deviceInfo: finalDeviceInfo,
      rawData: {
        userAgent: req.headers['user-agent'],
        payload: req.body,
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

app.get('/api/devices', async (req, res) => {
  try {
    const devices = await GPS.find().sort({ timestamp: -1 });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
