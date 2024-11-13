// Pfad: src\app\api\hkl\[hklId]\route.ts
import { NextResponse } from 'next/server';
import { openDB } from '@/lib/db';

// Handler für GET-Requests auf der HKL-Seite
export async function GET(request: Request, { params }: { params: { hklId: string } }) {
  const { hklId } = params;
  const url = new URL(request.url);


  try {
    const db = await openDB();

    // Daten aus der Datenbank abrufen, basierend auf dem HKL-Wert (hklId)
    const data = await db.all(
      `SELECT id, NAME, VAR_VALUE, unit, HKL_Feld, MIN, MAX, OPTI, TYPE
       FROM QHMI_VARIABLES 
       WHERE HKL = ? `,
      [hklId]
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fehler beim Abrufen der Daten:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Daten' }, { status: 500 });
  }
}
