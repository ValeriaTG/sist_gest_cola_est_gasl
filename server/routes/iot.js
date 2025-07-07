const express = require('express');
const { iotService } = require('../services/iotService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get real-time sensor data
router.get('/sensors/:pumpId?', authenticateToken, async (req, res) => {
  try {
    const { pumpId } = req.params;
    const readings = await iotService.getLatestReadings(pumpId ? parseInt(pumpId) : null);
    res.json(readings);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

// Get maintenance recommendations
router.get('/maintenance', authenticateToken, async (req, res) => {
  try {
    const maintenanceNeeds = await iotService.checkMaintenanceNeeds();
    res.json(maintenanceNeeds);
  } catch (error) {
    console.error('Error checking maintenance needs:', error);
    res.status(500).json({ error: 'Failed to check maintenance needs' });
  }
});

// Get real-time pump status
router.get('/status', async (req, res) => {
  try {
    const status = await iotService.getRealTimePumpStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting pump status:', error);
    res.status(500).json({ error: 'Failed to get pump status' });
  }
});

// Simulate pump event (for testing)
router.post('/simulate/:pumpId', authenticateToken, (req, res) => {
  const { pumpId } = req.params;
  const { event } = req.body;

  // Simulate different events
  const sensorData = iotService.generateSensorData(parseInt(pumpId));
  
  if (event === 'low_fuel') {
    sensorData.readings.fuelLevel = 5;
    sensorData.anomalies.push('LOW_FUEL');
  } else if (event === 'high_temperature') {
    sensorData.readings.temperature = 45;
    sensorData.anomalies.push('HIGH_TEMPERATURE');
  } else if (event === 'maintenance_needed') {
    sensorData.readings.vibration = 9;
    sensorData.anomalies.push('HIGH_VIBRATION');
  }

  iotService.saveSensorData(sensorData);
  
  res.json({
    message: `Event '${event}' simulated for pump ${pumpId}`,
    sensorData
  });
});

module.exports = router;