import { NextRequest } from 'next/server';
import pool from '@/lib/mariadb';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendAlarms = async () => {
        let connection;
        try {
          connection = await pool.getConnection();
          const [alarms] = await connection.query(`
            SELECT DISTINCT a.id, a.address, m.name, m.old_value, a.new_value, a.timestamp, a.text
            FROM alarms a
            JOIN mqtt_data m ON a.address = m.address
            ORDER BY a.timestamp DESC
            LIMIT 100
          `);
          
          const data = JSON.stringify(alarms);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error('Fehler beim Abrufen der Alarme:', error);
          controller.error(error);
        } finally {
          if (connection) connection.release();
        }
      };

      // Initiales Senden der Daten
      await sendAlarms();

      // Periodisches Senden der Daten
      const interval = setInterval(sendAlarms, 5000);

      // Aufräumen, wenn die Verbindung geschlossen wird
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}