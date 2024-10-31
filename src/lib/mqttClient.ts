// src/lib/initMqttClient.ts

import mqtt from 'mqtt';
import pool from '@/lib/mariadb';
import { RowDataPacket } from 'mysql2/promise';

interface MqttMessage {
  address: number;
  value: number;
  topic: string;
  gw: string;
}

// Singleton-MQTT-Client
let client: mqtt.MqttClient | null = null;

const initializeMqttClient = () => {
  if (client) {
    return; // Verhindert Mehrfach-Initialisierung
  }

  client = mqtt.connect('mqtt://192.168.10.31:1883', {
    // Authentifizierungsoptionen, falls erforderlich
    // username: 'your-username',
    // password: 'your-password',
  });

  client.on('connect', () => {
    console.log('MQTT-Client verbunden');
    client?.subscribe('modbus/alarm', (err) => {
      if (err) {
        console.error('Fehler beim Abonnieren des Topics:', err);
      } else {
        console.log('Abonniert: modbus/alarm');
      }
    });
  });

  client.on('error', (err) => {
    console.error('MQTT-Fehler:', err);
    client?.end();
    client = null;
  });

  client.on('message', async (topic: string, message: Buffer) => {
    try {
      const msg: MqttMessage = JSON.parse(message.toString());
      console.log(`Nachricht empfangen auf Topic ${topic}:`, msg);
      await handleMqttMessage(msg);
    } catch (error) {
      console.error('Fehler beim Verarbeiten der MQTT-Nachricht:', error);
    }
  });

  console.log('MQTT-Client initialisiert');
};

const handleMqttMessage = async (msg: MqttMessage) => {
  const { address, value } = msg;

  // 1. Überprüfen, ob die Adresse in der addresses-Tabelle existiert
  const [addressRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM addresses WHERE address = ?',
    [address]
  );

  if (addressRows.length === 0) {
    console.warn(`Keine Adresse gefunden für: ${address}`);
    return;
  }

  const addressName = addressRows[0].name;

  // 2. Aktuellen Wert in die Datenbank schreiben
  await pool.query(
    'UPDATE addresses SET value = ? WHERE address = ?',
    [value, address]
  );

  // 3. Regeln für diese Adresse abrufen
  const [ruleRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM rules WHERE address = ?',
    [address]
  );

  if (ruleRows.length === 0) {
    console.warn(`Keine Regeln gefunden für Adresse: ${address}`);
    return;
  }

  // 4. Überprüfen und verarbeiten Sie jede Regel
  for (const rule of ruleRows) {
    const { id: rule_id, value: ruleValue, type, priority, text, text_unfulfilled, bit_number } = rule;

    let ruleFulfilled = false;

    if (type === 'standard') {
      // Überprüfen, ob der empfangene Wert gleich dem Regelwert ist
      ruleFulfilled = value === ruleValue;
    } else if (type === 'bit' && bit_number !== null) {
      // Überprüfen, ob ein bestimmtes Bit gesetzt ist
      ruleFulfilled = (value & (1 << bit_number)) !== 0;
    }

    // 5. Eintrag im Ereignisprotokoll machen
    await pool.query(
      'INSERT INTO event_log (timestamp, type, rule_id, text) VALUES (NOW(), ?, ?, ?)',
      [
        ruleFulfilled ? 'rule_fulfilled' : 'rule_unfulfilled',
        rule_id,
        ruleFulfilled ? text : text_unfulfilled
      ]
    );

    // 6. Aktive/Inaktive Einträge aktualisieren
    if (ruleFulfilled) {
      // Eintrag in der Tabelle 'active_entries' erstellen oder aktualisieren
      await pool.query(
        'INSERT INTO active_entries (rule_id, name, priority, timestamp) VALUES (?, ?, ?, NOW()) ' +
        'ON DUPLICATE KEY UPDATE timestamp = NOW()',
        [rule_id, text, priority]
      );
    } else {
      // Eintrag aus der Tabelle 'active_entries' entfernen
      await pool.query(
        'DELETE FROM active_entries WHERE rule_id = ?',
        [rule_id]
      );
    }
  }
};

// Initialisieren Sie den MQTT-Client beim Laden des Moduls
initializeMqttClient();

export default initializeMqttClient;
