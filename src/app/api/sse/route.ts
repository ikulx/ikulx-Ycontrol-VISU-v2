import { NextResponse } from 'next/server';
import { openDB } from '@/lib/db';

export async function GET(req: Request) {
  const db = await openDB();
  
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const stream = new ReadableStream({
    start(controller) {
      const send = async () => {
        try {
          // Query, um alle VAR_VALUE und die zugehörigen IDs abzurufen
          const query = `
            SELECT id, VAR_VALUE 
            FROM QHMI_VARIABLES
          `;
          const data = await db.all(query);

          // Sende die Daten als JSON über den SSE-Stream
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
          console.error('Fehler beim Abrufen der Daten:', error);
          controller.enqueue(`event: error\ndata: ${JSON.stringify({ error: 'Daten konnten nicht abgerufen werden.' })}\n\n`);
        }
      };

      // Sende Daten alle 5 Sekunden
      const interval = setInterval(send, 5000);

      // Clean up, wenn die Verbindung abgebrochen wird
      const cleanup = () => {
        clearInterval(interval);
        controller.close();
      };

      req.signal.addEventListener('abort', cleanup);
    },
  });

  return new NextResponse(stream, { headers });
}
