// src/app/api/sse/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/mariadb';

let clients: any[] = [];

// Funktion zum Senden der aktuellen Namen und Regeltexte an die Clients
async function sendCurrentData() {
  try {
    // Hole alle Adressen mit Namen und Werte aus der Datenbank
    const [addresses] = await db.execute('SELECT * FROM addresses WHERE name IS NOT NULL AND name != ""');

    // Hole alle Regeln aus der Datenbank
    const [rules] = await db.execute('SELECT * FROM rules');

    // Bereite die Daten für den Client auf
    const data = addresses.map((address: any) => {
      const matchingRules = rules.filter((rule: any) => rule.address === address.address);
      const ruleTexts = matchingRules.map((rule: any) => {
        return address.value === rule.condition_value ? rule.text_in : rule.text_out;
      });
      return {
        address: address.address,
        name: address.name,
        value: address.value,
        ruleTexts: ruleTexts,
      };
    });

    // Sende die Daten an alle verbundenen Clients
    clients.forEach((controller) => {
      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
    });
  } catch (error) {
    console.error('Error fetching or sending data:', error);
  }
}

export async function GET(req: Request) {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const stream = new ReadableStream({
    start(controller) {
      // Fügen Sie den neuen Client zur Liste hinzu
      clients.push(controller);

      // Senden Sie sofort die aktuellen Daten an den neuen Client
      sendCurrentData();

      // Entfernen Sie den Client, wenn die Verbindung geschlossen wird
      req.signal.addEventListener('abort', () => {
        clients = clients.filter((c) => c !== controller);
      });
    },
  });

  return new NextResponse(stream, { headers });
}

// Starte einen Intervall-Timer, um die Daten regelmäßig zu senden (z.B. alle 5 Sekunden)
setInterval(sendCurrentData, 5000);
