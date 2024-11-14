// Pfad: src\app\api\editor\stream\[editor]\route.ts
import { NextResponse } from 'next/server';
import { openDB } from '../../../../../lib/db';  // Verbindung zur SQLite-Datenbank

export async function GET(request: Request, { params }: { params: { editor: string } }) {
  const encoder = new TextEncoder();
  const editor = params.editor;

  return new Response(
    new ReadableStream({
      async start(controller) {
        const db = await openDB();

        const sendData = async () => {
          try {
            // Daten für den spezifischen Editor aus der Datenbank abrufen
            const data = await db.all(
              `SELECT id, NAME, VAR_VALUE, TYPE, OPTI, MIN, MAX, unit FROM QHMI_VARIABLES WHERE EDITOR = ?`,
              [editor]
            );
            
            // Daten als Event an den Client senden
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          } catch (error) {
            console.error('Fehler beim Abrufen der Daten:', error);
            controller.close();
          }
        };

        // Initiales Senden der Daten
        await sendData();

        // Simuliert eine periodische Datenaktualisierung
        const interval = setInterval(async () => {
          await sendData();
        }, 5000); // Alle 5 Sekunden aktualisieren

        // Aufräumarbeiten, wenn der Stream geschlossen wird
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
}
