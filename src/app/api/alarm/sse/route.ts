// src/app/api/alarm/sse/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';
import type { NextRequest } from 'next/server';
import type { RowDataPacket } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    // Erstellen Sie den Stream und den Writer
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Funktion zum Senden von Daten an den SSE-Stream
    const sendSSE = async (data: any) => {
      writer.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Funktion zum Abrufen und Senden aktiver Einträge
    const fetchAndSendActiveEntries = async () => {
      try {
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT * FROM active_entries ORDER BY timestamp DESC'
        );
        await sendSSE(rows);
      } catch (error) {
        console.error('Fehler beim Abrufen der aktiven Einträge:', error);
        await sendSSE({ error: 'Fehler beim Abrufen der aktiven Einträge.' });
      }
    };

    // Initialdaten senden
    await fetchAndSendActiveEntries();

    // Intervalle zur periodischen Aktualisierung der Daten
    const interval = setInterval(fetchAndSendActiveEntries, 5000);

    // Stream-Behandlungslogik
    readable.pipeTo(new WritableStream({
      close() {
        clearInterval(interval);
        writer.close();
      },
      abort() {
        clearInterval(interval);
        writer.close();
      }
    }));

    // Rückgabe der SSE-Antwort
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des SSE-Streams:', error);
    return new NextResponse('Fehler beim Erstellen des SSE-Streams', { status: 500 });
  }
}
