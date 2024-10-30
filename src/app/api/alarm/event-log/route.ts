// src/app/api/alarm/event-log/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb'; // Stellen Sie sicher, dass der Pfad korrekt ist
import type { NextRequest } from 'next/server';
import type { RowDataPacket } from 'mysql2/promise';

interface EventLogWithAddress extends RowDataPacket {
  id: number;
  timestamp: string;
  type: string;
  rule_id: number | null;
  text: string;
  name: string | null; // Name aus der addresses-Tabelle
  priority: 'prio1' | 'prio2' | 'warn' | 'info' | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // Gesamte Anzahl der Einträge abrufen
    const [countResult] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM event_log');
    const total = countResult[0]['count'] as number;

    // Paginierten Einträge mit Name und Priorität abrufen
    const [rows] = await pool.query<EventLogWithAddress[]>(
      `SELECT 
         event_log.*, 
         addresses.name AS name, 
         rules.priority 
       FROM event_log 
       LEFT JOIN rules ON event_log.rule_id = rules.id 
       LEFT JOIN addresses ON rules.address = addresses.address 
       ORDER BY event_log.timestamp DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return NextResponse.json({
      data: rows,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse('Fehler beim Abrufen des Ereignisprotokolls', { status: 500 });
  }
}
