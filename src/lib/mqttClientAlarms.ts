// Pfad: src\lib\mqttClientAlarms.ts
import mqtt from 'mqtt';
import { processAlarmData } from './alarmProcessor';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://192.168.10.31:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC_DATA || 'modbus/alarm/daten';

let isQuittierungActive = false;
let quittierungTimer: NodeJS.Timeout | null = null;

function startMqttClientAlarms() {
  const client = mqtt.connect(MQTT_BROKER_URL);

  client.on('connect', () => {
    console.log('Verbunden mit MQTT Broker');
    client.subscribe(MQTT_TOPIC, (err) => {
      if (!err) {
        console.log('Abonniert Topic:', {MQTT_TOPIC});
      } else {
        console.error('Fehler beim Abonnieren des Topics:', err);
      }
    });
  });

  client.on('message', (topic, message) => {
    // console.log(Nachricht empfangen auf Topic ${topic});
    if (!isQuittierungActive) {
      processAlarmData(message);
    } else {
      console.log('Quittierung aktiv, Nachricht wird ignoriert');
    }
  });

  client.on('error', (error) => {
    console.error('MQTT Verbindungsfehler:', error);
  });

  return client;
}

export function startQuittierung() {
  if (isQuittierungActive) {
    console.log('Quittierung bereits aktiv');
    return;
  }

  isQuittierungActive = true;
  console.log('Quittierung gestartet');

  if (quittierungTimer) {
    clearTimeout(quittierungTimer);
  }

  quittierungTimer = setTimeout(() => {
    isQuittierungActive = false;
    console.log('Quittierung beendet');
    quittierungTimer = null;
  }, 15000);
}

export function getQuittierungStatus() {
  return isQuittierungActive;
}

export default startMqttClientAlarms;