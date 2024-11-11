import { connect } from 'mqtt';
import pool from './mariadb';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://192.168.10.31:1883';
const MQTT_TOPIC = 'modbus/alarm/status';

const client = connect(MQTT_BROKER_URL);

interface AlarmStatus {
  totalActive: number;
  prio1: number;
  prio2: number;
  prio3: number;
  warnung: number;
  info: number;
}

async function getAlarmStatus(): Promise<AlarmStatus> {
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query(`
      SELECT 
        COUNT(*) as totalActive,
        SUM(CASE WHEN priority = 'prio1' THEN 1 ELSE 0 END) as prio1,
        SUM(CASE WHEN priority = 'prio2' THEN 1 ELSE 0 END) as prio2,
        SUM(CASE WHEN priority = 'prio3' THEN 1 ELSE 0 END) as prio3,
        SUM(CASE WHEN priority = 'warnung' THEN 1 ELSE 0 END) as warnung,
        SUM(CASE WHEN priority = 'info' THEN 1 ELSE 0 END) as info
      FROM alarms
    `);
    return result[0] as AlarmStatus;
  } finally {
    if (connection) connection.release();
  }
}

export function startAlarmStatusService() {
  setInterval(async () => {
    try {
      const status = await getAlarmStatus();
      client.publish(MQTT_TOPIC, JSON.stringify(status));
      console.log('Alarm status sent:', status);
    } catch (error) {
      console.error('Error sending alarm status:', error);
    }
  }, 5000);
}