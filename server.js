require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mohamedbeyhaqi:bQJx9JfwQNlJEXOE@cluster0.eu65h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// Define Schema & Model
const gpsSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  phoneName: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});
const GPS = mongoose.model('GPS', gpsSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint to Save GPS Data
app.post('/api/gps', async (req, res) => {
  const { latitude, longitude, deviceId, phoneName } = req.body;
  console.log(`Received location update from ${deviceId} (${phoneName}): ${latitude}, ${longitude}`);
  
  if (!latitude || !longitude || !deviceId || !phoneName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await GPS.findOneAndUpdate(
      { deviceId },
      { phoneName, latitude, longitude, timestamp: new Date() },
      { upsert: true, new: true }
    );
    console.log(`Location updated for ${deviceId}:`, result);
    res.json({ success: true, message: 'Location updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API Endpoint to Retrieve GPS Data
app.get('/api/gps', async (req, res) => {
  try {
    const locations = await GPS.find().sort({ timestamp: -1 });
    console.log(`Sending ${locations.length} locations`);
    res.json(locations);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Serve Frontend
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
