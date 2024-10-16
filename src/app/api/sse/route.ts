// src/app/api/sse/route.ts
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
          const query = `
            SELECT id, VAR_VALUE 
            FROM QHMI_VARIABLES
          `;
          const data = await db.all(query);

          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
          console.error('Fehler beim Abrufen der Daten:', error);
          controller.enqueue(`event: error\ndata: ${JSON.stringify({ error: 'Daten konnten nicht abgerufen werden.' })}\n\n`);
        }
      };

      const interval = setInterval(send, 5000);

      const cleanup = () => {
        clearInterval(interval);
        controller.close();
      };

      req.signal.addEventListener('abort', cleanup);
    },
  });

  return new NextResponse(stream, { headers });
}
