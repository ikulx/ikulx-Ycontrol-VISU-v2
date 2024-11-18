// Pfad: src/lib/serverStartup.ts
import startMqttClientAlarms from '@/lib/mqttClientAlarms';

let mqttClientAlarms: ReturnType<typeof startMqttClientAlarms> | null = null;

export function initializeMQTTClient() {
  if (!mqttClientAlarms) {
    console.log('Initialisiere MQTT-Client...');
    mqttClientAlarms = startMqttClientAlarms();
    console.log('MQTT-Client gestartet.');
  } else {
    console.log('MQTT-Client läuft bereits.');
  }
}
