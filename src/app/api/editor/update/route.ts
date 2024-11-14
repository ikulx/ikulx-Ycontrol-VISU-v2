// Pfad: src\app\api\editor\update\route.ts
import { NextResponse } from 'next/server';
import { openDB } from '../../../../lib/db';  // SQLite-Datenbankverbindung

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, VAR_VALUE } = body;

    if (!id || VAR_VALUE === undefined) {
      return NextResponse.json({ error: 'ID oder VAR_VALUE fehlen.' }, { status: 400 });
    }

    const db = await openDB();

    // Aktualisiere die Daten in der Datenbank
    const result = await db.run(
      `UPDATE QHMI_VARIABLES SET VAR_VALUE = ?, last_modified = ? WHERE id = ?`,
      [VAR_VALUE, new Date().toISOString(), id]
    );

    if (result && result.changes !== undefined && result.changes > 0) {

    
      console.log('Wert erfolgreich in der DB aktualisiert:', { id, VAR_VALUE });
      return NextResponse.json({ message: 'VAR_VALUE erfolgreich aktualisiert' });
    } else {
      return NextResponse.json({ error: 'Kein Eintrag mit dieser ID gefunden.' }, { status: 404 });
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren von VAR_VALUE:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Wertes' }, { status: 500 });
  }
}
