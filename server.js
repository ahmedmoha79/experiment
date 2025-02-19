// Define Schema & Model
const gpsSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  phoneName: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  additionalInfo: {
    deviceName: String,
    deviceBrand: String,
    os: String,
    osVersion: String,
    browser: String,
    browserVersion: String,
    cpu: String,
    userAgent: String
  }
});
const GPS = mongoose.model('GPS', gpsSchema);

// API Endpoint to Save GPS Data
app.post('/api/gps', async (req, res) => {
  const { latitude, longitude, deviceId, phoneName, additionalInfo } = req.body;

  // Log incoming request for debugging
  console.log('Incoming GPS Data:', {
    deviceId,
    phoneName,
    latitude,
    longitude,
    additionalInfo
  });

  // Validate required fields
  if (!latitude || !longitude || !deviceId || !phoneName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Create or update the location for the specific device
    const result = await GPS.findOneAndUpdate(
      { deviceId },
      { 
        phoneName,
        latitude,
        longitude,
        timestamp: new Date(),
        additionalInfo: additionalInfo || {}
      },
      { upsert: true, new: true }
    );

    console.log('Location updated in DB:', result);
    res.json({ success: true, message: 'Location updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});
