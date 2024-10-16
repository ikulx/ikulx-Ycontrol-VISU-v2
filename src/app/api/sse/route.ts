// src/app/api/sse/route.ts

export const dynamic = 'force-dynamic'; // Erzwingt dynamische Generierung

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { signal } = req; // AbortSignal

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: any) => {
        const msg = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(msg)); // Enqueue Uint8Array
      };

      // Sende initiale Daten
      send({ message: 'SSE-Verbindung hergestellt' });

      // Beispiel: Daten alle 5 Sekunden senden
      const interval = setInterval(() => {
        send({ message: 'Update', timestamp: new Date().toISOString() });
      }, 5000);

      // Clean up, wenn die Verbindung abgebrochen wird
      const cleanup = () => {
        clearInterval(interval);
        controller.close();
      };

      // Falls die Verbindung abgebrochen wird
      signal.addEventListener('abort', cleanup);
    },
  });

  return new NextResponse(stream, { headers });
}
