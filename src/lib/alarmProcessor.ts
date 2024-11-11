import pool from './mariadb';
import { startAlarmStatusService } from './alarmStatusService';

export async function processAlarmData(message: Buffer) {
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
        const [rules] = await connection.query('SELECT * FROM rules WHERE address = ?', [address]);
        
        for (const rule of rules) {
          if (rule.rule_type === 'value' && rule.value === value.toString()) {
            await createAlarm(connection, address, value, rule.text, rule.priority);
          } else if (rule.rule_type === 'bit') {
            const [bitRules] = await connection.query('SELECT * FROM bit_rules WHERE rule_id = ?', [rule.id]);
            const intValue = parseInt(value.toString());
            
            for (const bitRule of bitRules) {
              const bitValue = (intValue & (1 << bitRule.bit_position)) !== 0;
              const text = bitValue ? bitRule.text_on : bitRule.text_off;
              await createAlarm(connection, address, value, text, bitRule.priority);
            }
          }
        }
      }
    }

    await connection.commit();
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Fehler beim Verarbeiten der Alarm-Daten:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function createAlarm(connection, address, value, text, priority) {
  // Adressname abrufen
  const [addressNames] = await connection.query('SELECT name FROM mqtt_data WHERE address = ?', [address]);
  const addressName = addressNames[0]?.name || address.toString();
  
  // Alarm mit Text und Priorität erstellen (in beiden Tabellen)
  const timestamp = Date.now();
  await connection.query('INSERT INTO alarms (address, address_name, new_value, timestamp, text, priority) VALUES (?, ?, ?, ?, ?, ?)', 
    [address, addressName, value, timestamp, text, priority]);
  await connection.query('INSERT INTO all_alarms (address, address_name, new_value, timestamp, text, quittanced, entry_type, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
    [address, addressName, value, timestamp, text, false, 'alarm', priority]);
  
  console.log(`Alarm created for address ${address} (${addressName}) with priority ${priority}`);
}

export async function clearAlarms() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('DELETE FROM alarms');
    console.log('Alarme gelöscht');
  } catch (error) {
    console.error('Fehler beim Löschen der Alarme:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function resetValues() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('UPDATE mqtt_data SET old_value = "0", value = "0"');
    console.log('Old values and current values reset to 0');
  } catch (error) {
    console.error('Error resetting values:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function quittanceAllAlarms() {
  let connection;
  try {
    connection = await pool.getConnection();
    const timestamp = Date.now();
    
    // Markiere alle nicht quittierten Alarme als quittiert
    await connection.query('UPDATE all_alarms SET quittanced = true, quittanced_at = ? WHERE quittanced = false', [timestamp]);
    
    // Füge einen einzelnen Quittierungseintrag hinzu
    // Verwende einen speziellen Wert für die Adresse, z.B. 0 oder -1
    const specialAddress = 0; // oder -1, je nachdem, was in Ihrem System Sinn macht
    await connection.query(
      'INSERT INTO all_alarms (address, address_name, new_value, timestamp, text, quittanced, quittanced_at, entry_type, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [specialAddress, 'System', '', timestamp, 'Alle Alarme quittiert', true, timestamp, 'quittance', 'info']
    );
    
    console.log('All alarms quittanced and entry added');
  } catch (error) {
    console.error('Error quittancing alarms:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

startAlarmStatusService();