// src/app/api/reset/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Löschen aller aktiven und inaktiven Einträge
    await pool.query('DELETE FROM active_inactive_entries');

    return NextResponse.json({ message: 'Einträge erfolgreich zurückgesetzt.' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return new NextResponse('Fehler beim Zurücksetzen der Einträge', { status: 500 });
  }
}
