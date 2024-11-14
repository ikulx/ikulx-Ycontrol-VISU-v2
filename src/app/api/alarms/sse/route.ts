
// Path: src/app/api/alarms/sse/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export const dynamic = "force-dynamic";  // Verhindert statischen Export

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  // Create a ReadableStream to handle SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Function to send data to the client
      const sendData = async () => {
        if (!pool) {
          const error = new Error("Database pool is undefined. Check database connection settings.");
          console.error(error.message);
          controller.error(error);
          return;
        }

        let connection;
        try {
          connection = await pool.getConnection();

          const [currentAlarms] = await connection.query(`
            SELECT id, address, address_name, new_value, timestamp, text, priority
            FROM alarms
            ORDER BY timestamp DESC
          `);

          const [allAlarms] = await connection.query(`
            SELECT id, address, address_name, new_value, timestamp, text, quittanced, quittanced_at, entry_type, priority
            FROM all_alarms
            ORDER BY timestamp DESC
            LIMIT 100
          `);

          // Serialize data as SSE format
          const sseData = `data: ${JSON.stringify({ currentAlarms, allAlarms })}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch (error) {
          console.error('Error fetching alarm data:', error);
          controller.error(error);
        } finally {
          if (connection) connection.release();
        }
      };

      // Send initial data and start interval to periodically update
      await sendData();
      const intervalId = setInterval(sendData, 5000);

      // Cleanup when client disconnects
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
