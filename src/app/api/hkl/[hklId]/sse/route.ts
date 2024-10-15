// app/api/hkl/[hklId]/sse/route.ts
import { openDB } from '@/lib/db';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { hklId: string } }
) {
  const { hklId } = params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Funktion zum Senden von Daten an den Client
      const sendData = async () => {
        try {
          const db = await openDB();

          // Daten aus der Datenbank abrufen
          const data = await db.all(
            `SELECT id, NAME, VAR_VALUE, unit, HKL_Feld, MIN, MAX, OPTI, TYPE
             FROM QHMI_VARIABLES 
             WHERE HKL = ?`,
            [hklId]
          );

          // SSE-Daten vorbereiten
          const sseData = `data: ${JSON.stringify(data)}\n\n`;

          // Daten in den Stream einfügen
          controller.enqueue(encoder.encode(sseData));
        } catch (error) {
          console.error('Fehler beim Abrufen der Daten:', error);
          controller.error(error);
        }
      };

      // Initiales Senden von Daten
      await sendData();

      // Intervall einrichten, um Daten alle 5 Sekunden zu senden
      const intervalId = setInterval(sendData, 5000);

      // Umgang mit Client-Abbruch
      const close = () => {
        clearInterval(intervalId);
        controller.close();
      };

      request.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
