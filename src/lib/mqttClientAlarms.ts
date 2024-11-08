
import mqtt from 'mqtt';
import pool from './mariadb';

const MQTT_BROKER_URL = 'mqtt://192.168.10.31:1883'; // Ersetzen Sie dies durch Ihre tatsächliche MQTT-Broker-URL
const MQTT_TOPIC = 'modbus/alarm/data';

async function processMessage(message: Buffer) {
  const data = JSON.parse(message.toString());
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const item of data) {
      console.log(`Processing item: Address ${item.address}, Value ${item.value}, Topic ${item.topic}`);
      const { address, value, topic } = item;

      // Überprüfen, ob die Adresse bereits existiert
      const [existingEntries] = await connection.query('SELECT * FROM mqtt_data WHERE address = ? FOR UPDATE', [address]);
      const existingEntry = existingEntries[0];

      if (!existingEntry) {
        // Neue Adresse einfügen
        await connection.query('INSERT INTO mqtt_data (address, value, old_value, original_topic) VALUES (?, ?, ?, ?)', [address, value, value, topic]);
        console.log(`New address inserted: ${address}`);
      } else if (existingEntry.value !== value.toString()) {
        // Wert aktualisieren, old_value setzen und Alarm erstellen
        await connection.query('UPDATE mqtt_data SET old_value = value, value = ? WHERE address = ?', [value, address]);
        
        // Regel für den neuen Wert finden
        const [rules] = await connection.query('SELECT * FROM rules WHERE address = ? AND value = ?', [address, value]);
        const ruleText = rules.length > 0 ? rules[0].text : 'Kein Text verfügbar';
        
        // Alarm mit Text erstellen (ohne old_value)
        await connection.query('INSERT INTO alarms (address, new_value, timestamp, text) VALUES (?, ?, ?, ?)', 
          [address, value, Date.now(), ruleText]);
        
        console.log(`Alarm created for address ${address}`);
      }
    }

    await connection.commit();
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Fehler beim Verarbeiten der MQTT-Nachricht:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

function startMqttClientAlarms() {
  const client = mqtt.connect(MQTT_BROKER_URL);

  client.on('connect', () => {
    console.log('Verbunden mit MQTT Broker');
    client.subscribe(MQTT_TOPIC, (err) => {
      if (!err) {
        console.log(`Abonniert Topic: ${MQTT_TOPIC}`);
      } else {
        console.error('Fehler beim Abonnieren des Topics:', err);
      }
    });
  });

  client.on('message', (topic, message) => {
    console.log(`Nachricht empfangen auf Topic ${topic}`);
    processMessage(message);
  });

  client.on('error', (error) => {
    console.error('MQTT Verbindungsfehler:', error);
  });

  return client;
}

export default startMqttClientAlarms;