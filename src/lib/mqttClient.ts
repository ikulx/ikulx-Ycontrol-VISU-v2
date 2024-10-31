// src/lib/mqttClient.ts
import mqtt from 'mqtt';
import { db } from './mariadb'; // Importiere die Datenbankverbindung

if (typeof window === 'undefined') {
  const client = mqtt.connect('mqtt://192.168.10.31:1883');

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('modbus/alarm', (err) => {
      if (err) {
        console.error('Failed to subscribe to MQTT topic', err);
      } else {
        console.log('Successfully subscribed to modbus/alarm');
      }
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const alarms = JSON.parse(message.toString());
      console.log('Received alarms:', alarms);

      // Hole alle Regeln aus der Datenbank
      const [rules] = await db.execute('SELECT * FROM rules');

      for (const alarm of alarms) {
        if (alarm.address && typeof alarm.value === 'number') {
          try {
            // Aktualisiere den Wert in der Datenbank
            await db.execute(
              `UPDATE addresses SET value = ? WHERE address = ?`,
              [alarm.value, alarm.address]
            );

            // Überprüfe, ob eine Regel für diese Adresse erfüllt ist
            const relevantRules = rules.filter((rule: any) => rule.address === alarm.address);
            const matchedTexts = relevantRules.map((rule: any) => {
              return alarm.value === rule.condition_value ? rule.text_in : rule.text_out;
            });

            // Sende die aktualisierten Daten an die SSE-Clients
            sendDataToClients(alarm.address, matchedTexts);
          } catch (dbError) {
            console.error('Database error during update:', dbError);
          }
        } else {
          console.error('Invalid alarm data:', alarm);
        }
      }
    } catch (parseError) {
      console.error('Error parsing MQTT message:', parseError);
    }
  });

  client.on('error', (error) => {
    console.error('MQTT connection error:', error);
  });
}

// Funktion zum Senden der Daten an die SSE-Clients
function sendDataToClients(address: number, texts: string[]) {
  // Diese Funktion wird später in der SSE-API definiert
}
