// app/api/alarm/sse/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export async function GET() {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  let interval: NodeJS.Timeout;
  let controllerClosed = false;

  // Map zum Verfolgen des Zustands jeder Regel
  const ruleStates = new Map<number, boolean>(); // rule_id => isFulfilled

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendData = async () => {
        if (controllerClosed) {
          return;
        }
        try {
          // Daten abrufen und verarbeiten
          const [addresses]: any = await pool.query('SELECT * FROM addresses');
          const [rules]: any = await pool.query('SELECT * FROM rules');
          const [events]: any = await pool.query(
            'SELECT * FROM events WHERE timestamp >= NOW() - INTERVAL 1 DAY'
          );

          const entries: any[] = [];

          for (const address of addresses) {
            const addressEvents = events.filter(
              (event: any) => event.address === address.address
            );

            // Neueste Ereignis für die Adresse
            const latestEvent = addressEvents.sort(
              (a: any, b: any) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )[0];

            const addressRules = rules.filter(
              (rule: any) => rule.address === address.address
            );

            for (const rule of addressRules) {
              let currentState = false;

              if (rule.type === 'standard') {
                if (latestEvent && latestEvent.value == rule.value) {
                  currentState = true;
                }
              } else if (rule.type === 'bit') {
                if (latestEvent) {
                  const bitValue = (latestEvent.value >> rule.bit_number) & 1;
                  currentState = bitValue === 1;
                }
              }

              const prevState = ruleStates.get(rule.id) || false;

              if (prevState !== currentState) {
                ruleStates.set(rule.id, currentState);

                if (currentState) {
                  // Regel wurde erfüllt
                  let textToDisplay = '';

                  if (rule.type === 'standard') {
                    textToDisplay = rule.text;
                  } else if (rule.type === 'bit') {
                    textToDisplay = rule.text_on;
                  }

                  entries.push({
                    name: address.name,
                    address: address.address,
                    value: latestEvent ? latestEvent.value : null,
                    timestamp: latestEvent ? latestEvent.timestamp : new Date(),
                    text: textToDisplay,
                    rule_id: rule.id,
                    priority: rule.priority,
                    status: 'active' as const,
                  });

                  // Ereignis in event_log protokollieren
                  await pool.query(
                    'INSERT INTO event_log (type, rule_id, text) VALUES (?, ?, ?)',
                    ['rule_fulfilled', rule.id, textToDisplay]
                  );
                } else {
                  // Regel ist nicht mehr erfüllt
                  let textToDisplay = '';

                  if (rule.type === 'standard') {
                    textToDisplay = rule.text_unfulfilled;
                  } else if (rule.type === 'bit') {
                    textToDisplay = rule.text_off;
                  }

                  entries.push({
                    name: address.name,
                    address: address.address,
                    value: latestEvent ? latestEvent.value : null,
                    timestamp: latestEvent ? latestEvent.timestamp : new Date(),
                    text: textToDisplay,
                    rule_id: rule.id,
                    priority: rule.priority,
                    status: 'inactive' as const,
                  });

                  // Ereignis in event_log protokollieren
                  await pool.query(
                    'INSERT INTO event_log (type, rule_id, text) VALUES (?, ?, ?)',
                    ['rule_unfulfilled', rule.id, textToDisplay]
                  );
                }
              }
            }
          }

          // Einträge an den Client senden
          if (entries.length > 0) {
            const data = `data: ${JSON.stringify(entries)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch (error) {
          console.error('Fehler beim Senden der Daten:', error);
          controller.error(error);
        }
      };

      await sendData();
      interval = setInterval(sendData, 5000);
    },
    cancel() {
      if (interval) {
        clearInterval(interval);
      }
      controllerClosed = true;
    },
  });

  return new NextResponse(readable, { headers });
}
