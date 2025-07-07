const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cron = require('node-cron');

const DB_PATH = path.join(__dirname, '../../database.sqlite');

// IoT sensor data simulation
class IoTService {
  constructor() {
    this.sensors = new Map();
    this.isRunning = false;
  }

  // Initialize IoT sensors for each pump
  initializeSensors() {
    const db = new sqlite3.Database(DB_PATH);
    
    db.all('SELECT id, number FROM pumps', (err, pumps) => {
      if (err) {
        console.error('Error fetching pumps for IoT:', err);
        db.close();
        return;
      }

      pumps.forEach(pump => {
        this.sensors.set(pump.id, {
          pumpId: pump.id,
          pumpNumber: pump.number,
          fuelLevel: Math.random() * 100, // 0-100%
          temperature: 20 + Math.random() * 15, // 20-35°C
          pressure: 2 + Math.random() * 3, // 2-5 bar
          flowRate: 0, // L/min
          vibration: Math.random() * 10, // 0-10 units
          lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
      });

      db.close();
      console.log(`🔧 Initialized ${pumps.length} IoT sensors`);
    });
  }

  // Simulate sensor readings
  generateSensorData(pumpId) {
    const sensor = this.sensors.get(pumpId);
    if (!sensor) return null;

    // Simulate realistic changes
    sensor.fuelLevel = Math.max(0, sensor.fuelLevel - Math.random() * 2);
    sensor.temperature = 20 + Math.random() * 15 + (Math.sin(Date.now() / 3600000) * 5);
    sensor.pressure = 2 + Math.random() * 3;
    sensor.flowRate = Math.random() * 50; // 0-50 L/min
    sensor.vibration = Math.random() * 10;

    // Check for anomalies
    const anomalies = [];
    if (sensor.fuelLevel < 10) anomalies.push('LOW_FUEL');
    if (sensor.temperature > 40) anomalies.push('HIGH_TEMPERATURE');
    if (sensor.pressure < 1.5) anomalies.push('LOW_PRESSURE');
    if (sensor.vibration > 8) anomalies.push('HIGH_VIBRATION');

    return {
      pumpId,
      pumpNumber: sensor.pumpNumber,
      timestamp: new Date(),
      readings: {
        fuelLevel: parseFloat(sensor.fuelLevel.toFixed(2)),
        temperature: parseFloat(sensor.temperature.toFixed(1)),
        pressure: parseFloat(sensor.pressure.toFixed(2)),
        flowRate: parseFloat(sensor.flowRate.toFixed(1)),
        vibration: parseFloat(sensor.vibration.toFixed(2))
      },
      anomalies
    };
  }

  // Save sensor data to database
  saveSensorData(sensorData) {
    const db = new sqlite3.Database(DB_PATH);
    
    const readings = sensorData.readings;
    const queries = [
      ['fuel_level', readings.fuelLevel, '%'],
      ['temperature', readings.temperature, '°C'],
      ['pressure', readings.pressure, 'bar'],
      ['flow_rate', readings.flowRate, 'L/min'],
      ['vibration', readings.vibration, 'units']
    ];

    queries.forEach(([type, value, unit]) => {
      db.run(
        'INSERT INTO iot_sensors (sensor_type, pump_id, value, unit) VALUES (?, ?, ?, ?)',
        [type, sensorData.pumpId, value, unit],
        (err) => {
          if (err) {
            console.error('Error saving sensor data:', err);
          }
        }
      );
    });

    db.close();
  }

  // Get latest sensor readings
  getLatestReadings(pumpId = null) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(DB_PATH);
      
      let query = `
        SELECT 
          pump_id,
          sensor_type,
          value,
          unit,
          timestamp
        FROM iot_sensors 
        WHERE timestamp > datetime('now', '-1 hour')
      `;
      
      let params = [];
      
      if (pumpId) {
        query += ' AND pump_id = ?';
        params.push(pumpId);
      }
      
      query += ' ORDER BY timestamp DESC';

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          // Group by pump_id and sensor_type, taking the latest reading
          const grouped = {};
          rows.forEach(row => {
            if (!grouped[row.pump_id]) {
              grouped[row.pump_id] = {};
            }
            if (!grouped[row.pump_id][row.sensor_type]) {
              grouped[row.pump_id][row.sensor_type] = row;
            }
          });
          resolve(grouped);
        }
      });
    });
  }

  // Check for maintenance needs
  checkMaintenanceNeeds() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(DB_PATH);
      
      db.all(`
        SELECT 
          p.id,
          p.number,
          p.maintenance_date,
          AVG(CASE WHEN s.sensor_type = 'vibration' THEN s.value END) as avg_vibration,
          AVG(CASE WHEN s.sensor_type = 'temperature' THEN s.value END) as avg_temperature,
          MIN(CASE WHEN s.sensor_type = 'fuel_level' THEN s.value END) as min_fuel_level
        FROM pumps p
        LEFT JOIN iot_sensors s ON p.id = s.pump_id 
        WHERE s.timestamp > datetime('now', '-24 hours')
        GROUP BY p.id, p.number, p.maintenance_date
      `, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          const maintenanceNeeds = rows.filter(pump => {
            const daysSinceLastMaintenance = pump.maintenance_date 
              ? (Date.now() - new Date(pump.maintenance_date).getTime()) / (1000 * 60 * 60 * 24)
              : 365;
            
            return daysSinceLastMaintenance > 30 || 
                   pump.avg_vibration > 7 || 
                   pump.avg_temperature > 35 ||
                   pump.min_fuel_level < 5;
          });
          
          resolve(maintenanceNeeds);
        }
      });
    });
  }

  // Start IoT simulation
  start() {
    if (this.isRunning) return;
    
    this.initializeSensors();
    this.isRunning = true;

    // Update sensor data every 10 seconds
    this.sensorInterval = setInterval(() => {
      this.sensors.forEach((sensor, pumpId) => {
        const sensorData = this.generateSensorData(pumpId);
        if (sensorData) {
          this.saveSensorData(sensorData);
          
          // Log anomalies
          if (sensorData.anomalies.length > 0) {
            console.log(`⚠️  Pump ${sensorData.pumpNumber} anomalies:`, sensorData.anomalies);
          }
        }
      });
    }, parseInt(process.env.IOT_UPDATE_INTERVAL) || 10000);

    // Check maintenance needs every hour
    cron.schedule('0 * * * *', async () => {
      try {
        const maintenanceNeeds = await this.checkMaintenanceNeeds();
        if (maintenanceNeeds.length > 0) {
          console.log('🔧 Pumps needing maintenance:', maintenanceNeeds.map(p => p.number));
        }
      } catch (error) {
        console.error('Error checking maintenance needs:', error);
      }
    });

    console.log('🔧 IoT simulation started');
  }

  // Stop IoT simulation
  stop() {
    if (this.sensorInterval) {
      clearInterval(this.sensorInterval);
      this.sensorInterval = null;
    }
    this.isRunning = false;
    console.log('🔧 IoT simulation stopped');
  }

  // Get real-time pump status
  async getRealTimePumpStatus() {
    try {
      const readings = await this.getLatestReadings();
      const maintenanceNeeds = await this.checkMaintenanceNeeds();
      
      return {
        readings,
        maintenanceNeeds,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting real-time pump status:', error);
      return null;
    }
  }
}

const iotService = new IoTService();

function startIoTSimulation() {
  iotService.start();
}

function stopIoTSimulation() {
  iotService.stop();
}

module.exports = {
  iotService,
  startIoTSimulation,
  stopIoTSimulation
};