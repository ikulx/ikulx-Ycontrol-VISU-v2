// Pfad: src\lib\alarmStatusService.ts

import { connect, MqttClient } from 'mqtt';
import pool from './mariadb';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://192.168.10.31:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC_STATUS || 'modbus/alarm/status';

let client: MqttClient | null = null; // Specify the type as MqttClient or null

if (process.env.NODE_ENV !== 'production') {
  client = connect(MQTT_BROKER_URL);

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
  });

  client.on('error', (error) => {
    console.error('MQTT connection error:', error);
  });
}

interface AlarmStatus {
  totalActive: number;
  prio1: number;
  prio2: number;
  prio3: number;
  warnung: number;
  info: number;
}

async function getAlarmStatus(): Promise<AlarmStatus> {
  let connection: PoolConnection | null = null;
  try {
    if (pool) {
      connection = await pool.getConnection();
      const [result] = await connection.query<RowDataPacket[]>(`
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
    } else {
      throw new Error("Database pool is undefined");
    }
  } finally {
    if (connection) connection.release();
  }
}

export function startAlarmStatusService() {
  setInterval(async () => {
    try {
      const status = await getAlarmStatus();
      client?.publish(MQTT_TOPIC, JSON.stringify(status));
      console.log('Alarm status sent:', status);
    } catch (error) {
      console.error('Error sending alarm status:', error);
    }
  }, 5000);
}
