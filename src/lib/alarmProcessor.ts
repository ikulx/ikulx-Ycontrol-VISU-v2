import pool from './mariadb';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

interface MqttData extends RowDataPacket {
  address: string;
  value: string;
  old_value: string;
  original_topic: string;
  name?: string;
}

interface Rule extends RowDataPacket {
  id: number;
  address: string;
  value: string | null;
  text: string | null;
  priority: string;
  rule_type: string;
}

interface BitRule extends RowDataPacket {
  id: number;
  rule_id: number;
  bit_position: number;
  text_on: string;
  text_off: string;
  priority: string;
}

export async function processAlarmData(message: Buffer) {
  const messageString = message.toString();
  console.log('Received MQTT message:', messageString);

  let data: any;
  try {
    data = JSON.parse(messageString);
    console.log('Parsed JSON data:', data);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return;
  }

  if (!Array.isArray(data)) {
    console.error('Invalid data format. Expected an array.');
    return;
  }

  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const item of data) {
      const { address, value, topic } = item;
      console.log(`Processing item: Address ${address}, Value ${value}, Topic ${topic}`);

      const [existingEntries] = await connection.query<MqttData[]>('SELECT * FROM mqtt_data WHERE address = ? FOR UPDATE', [address]);

      if (existingEntries.length === 0) {
        console.log(`Address ${address} not found. Inserting new entry.`);
        await connection.query(
          'INSERT INTO mqtt_data (address, value, old_value, original_topic) VALUES (?, ?, ?, ?)',
          [address, value, value, topic]
        );
      } else {
        const existingEntry = existingEntries[0];
        if (existingEntry.value !== value.toString()) {
          console.log(`Updating address ${address}.`);
          await connection.query('UPDATE mqtt_data SET old_value = value, value = ? WHERE address = ?', [value, address]);

          // Process rules for the updated value
          const [rules] = await connection.query<Rule[]>('SELECT * FROM rules WHERE address = ?', [address]);

          for (const rule of rules) {
            if (rule.rule_type === 'value' && rule.value === value.toString()) {
              await createAlarm(connection, address, value, rule.text || '', rule.priority);
            } else if (rule.rule_type === 'bit') {
              const [bitRules] = await connection.query<BitRule[]>('SELECT * FROM bit_rules WHERE rule_id = ?', [rule.id]);
              const intValue = parseInt(value.toString(), 10);

              for (const bitRule of bitRules) {
                const bitValue = (intValue & (1 << bitRule.bit_position)) !== 0;
                const text = bitValue ? bitRule.text_on : bitRule.text_off;
                await createAlarm(connection, address, value, text, bitRule.priority);
              }
            }
          }
        }
      }
    }

    await connection.commit();
    console.log('Transaction committed.');
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error processing alarm data. Transaction rolled back:', error);
  } finally {
    if (connection) connection.release();
  }
}

async function createAlarm(
  connection: PoolConnection,
  address: string,
  value: any,
  text: string,
  priority: string
) {
  const [addressNames] = await connection.query<MqttData[]>('SELECT name FROM mqtt_data WHERE address = ?', [address]);
  const addressName = addressNames[0]?.name || address;

  const timestamp = Date.now();

  await connection.query(
    'INSERT INTO alarms (address, address_name, new_value, timestamp, text, priority) VALUES (?, ?, ?, ?, ?, ?)',
    [address, addressName, value, timestamp, text, priority]
  );

  await connection.query(
    'INSERT INTO all_alarms (address, address_name, new_value, timestamp, text, quittanced, entry_type, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [address, addressName, value, timestamp, text, false, 'alarm', priority]
  );

  console.log(`Alarm created for address ${address} with priority ${priority}.`);
}

export async function clearAlarms() {
  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();
    await connection.query('DELETE FROM alarms');
    console.log('All alarms cleared.');
  } catch (error) {
    console.error('Error clearing alarms:', error);
  } finally {
    if (connection) connection.release();
  }
}

export async function resetValues() {
  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();
    await connection.query('UPDATE mqtt_data SET old_value = "0", value = "0"');
    console.log('All values reset to 0.');
  } catch (error) {
    console.error('Error resetting values:', error);
  } finally {
    if (connection) connection.release();
  }
}

export async function quittanceAllAlarms() {
  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();
    const timestamp = Date.now();

    await connection.query(
      'UPDATE all_alarms SET quittanced = true, quittanced_at = ? WHERE quittanced = false',
      [timestamp]
    );

    await connection.query(
      'INSERT INTO all_alarms (address, address_name, new_value, timestamp, text, quittanced, quittanced_at, entry_type, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [0, 'System', '', timestamp, 'All alarms quittanced', true, timestamp, 'quittance', 'info']
    );

    console.log('All alarms quittanced.');
  } catch (error) {
    console.error('Error quittancing alarms:', error);
  } finally {
    if (connection) connection.release();
  }
}
