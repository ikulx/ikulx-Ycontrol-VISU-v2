import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendData = async () => {
        let connection;
        try {
          connection = await pool.getConnection();

          // Fetch current alarms
          const [currentAlarms] = await connection.query(`
            SELECT id, address, address_name, new_value, timestamp, text, priority
            FROM alarms
            ORDER BY timestamp DESC
          `);

          // Fetch all alarms (including quittanced)
          const [allAlarms] = await connection.query(`
            SELECT id, address, address_name, new_value, timestamp, text, quittanced, quittanced_at, entry_type, priority
            FROM all_alarms
            ORDER BY timestamp DESC
            LIMIT 100
          `);

          // Prepare SSE data
          const sseData = `data: ${JSON.stringify({ currentAlarms, allAlarms })}\n\n`;

          // Send data to the client
          controller.enqueue(encoder.encode(sseData));
        } catch (error) {
          console.error('Error fetching alarm data:', error);
          controller.error(error);
        } finally {
          if (connection) connection.release();
        }
      };

      // Send initial data
      await sendData();

      // Set up interval to send data every 5 seconds
      const intervalId = setInterval(sendData, 5000);

      // Handle client disconnection
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}