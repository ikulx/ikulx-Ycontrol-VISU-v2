import mqtt, { MqttClient } from 'mqtt';
import { processAlarmData } from './alarmProcessor';

const MQTT_BROKER_URL = 'mqtt://192.168.10.31:1883';
const MQTT_TOPIC = 'modbus/alarm/data';

let isQuittierungActive = false;
let quittierungTimer: NodeJS.Timeout | null = null;
let client: MqttClient | null = null; // Define client with proper type

function startMqttClientAlarms() {
  if (process.env.NODE_ENV !== 'production') {
    client = mqtt.connect(MQTT_BROKER_URL);

    client.on('connect', () => {
      console.log('Connected to MQTT Broker');
      client?.subscribe(MQTT_TOPIC, (err) => {
        if (!err) {
          console.log('Subscribed to Topic:', MQTT_TOPIC);
        } else {
          console.error('Error subscribing to topic:', err);
        }
      });
    });

    client.on('message', (topic, message) => {
      if (!isQuittierungActive) {
        processAlarmData(message);
      } else {
        console.log('Quittierung active, message ignored');
      }
    });

    client.on('error', (error) => {
      console.error('MQTT connection error:', error);
    });
  }
}

export function startQuittierung() {
  if (isQuittierungActive) {
    console.log('Quittierung already active');
    return;
  }

  isQuittierungActive = true;
  console.log('Quittierung started');

  if (quittierungTimer) {
    clearTimeout(quittierungTimer);
  }

  quittierungTimer = setTimeout(() => {
    isQuittierungActive = false;
    console.log('Quittierung ended');
    quittierungTimer = null;
  }, 15000);
}

export function getQuittierungStatus() {
  return isQuittierungActive;
}

export default startMqttClientAlarms;
