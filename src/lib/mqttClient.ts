import mqtt from 'mqtt'
import pool from './mariadb'

const client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://192.168.10.31:1883')

let lastClearTime = 0
const clearDelay = 10000 // 10 Sekunden
const addressLastNonZeroValue = new Map<number, number>()

client.on('connect', () => {
  console.log('Connected to MQTT broker')
  client.subscribe('modbus/alarm')
})

client.on('message', async (topic, message) => {
  if (topic === 'modbus/alarm') {
    try {
      const data = JSON.parse(message.toString())
      if (!Array.isArray(data)) {
        console.error('Received MQTT message is not an array:', data)
        return
      }

      const currentTime = Date.now()
      if (currentTime - lastClearTime < clearDelay) {
        console.log('Skipping alarm processing due to recent clear operation')
        return
      }

      for (const item of data) {
        if (typeof item.address === 'undefined' || typeof item.value === 'undefined') {
          console.error('Invalid item in MQTT message:', item)
          continue
        }

        // Füge die Adresse hinzu oder aktualisiere sie, wenn sie bereits existiert
        await pool.query(
          'INSERT INTO addresses (address) VALUES (?) ON DUPLICATE KEY UPDATE address = address',
          [item.address]
        )

        // Hole die ID der Adresse und die zugehörigen Regeln
        const [addressRows] = await pool.query('SELECT id, name FROM addresses WHERE address = ?', [item.address])
        
        if (addressRows.length > 0) {
          const { id: addressId, name } = addressRows[0]
          
          // Überprüfe, ob sich der Wert geändert hat
          const [lastValueRows] = await pool.query(
            'SELECT value FROM active_alarms WHERE address_id = ? ORDER BY timestamp DESC LIMIT 1',
            [addressId]
          )

          const lastValue = lastValueRows.length > 0 ? lastValueRows[0].value : null
          const lastNonZeroValue = addressLastNonZeroValue.get(addressId) || null

          if (lastValue !== item.value) {
            // Wenn der neue Wert 0 ist und der letzte Nicht-Null-Wert auch 0 war, überspringe diesen Eintrag
            if (item.value === 0 && lastNonZeroValue === 0) {
              continue
            }

            const [rulesRows] = await pool.query('SELECT * FROM rules WHERE address_id = ?', [addressId])
            
            for (const rule of rulesRows) {
              if (item.value === rule.value) {
                // Überprüfe, ob bereits ein aktiver Alarm für diese Adresse und Regel existiert
                const [existingAlarms] = await pool.query(
                  'SELECT * FROM active_alarms WHERE address_id = ? AND rule_text = ?',
                  [addressId, rule.message]
                )

                if (existingAlarms.length === 0) {
                  // Wenn kein Alarm existiert, erstelle einen neuen
                  await pool.query(
                    'INSERT INTO active_alarms (address_id, rule_text, timestamp, value) VALUES (?, ?, ?, ?)',
                    [addressId, rule.message, new Date(), item.value]
                  )
                }
              }
            }

            // Aktualisiere den letzten Nicht-Null-Wert für diese Adresse
            if (item.value !== 0) {
              addressLastNonZeroValue.set(addressId, item.value)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing MQTT message:', error)
    }
  }
})

export default client

// Funktion zum Aktualisieren der lastClearTime
export function updateLastClearTime() {
  lastClearTime = Date.now()
}