// /app/api/rules/[id]/route.ts
import { NextResponse } from 'next/server';
import { openDB } from '@/lib/db';

// DELETE-Methode: Regel löschen
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const db = await openDB();
  
  try {
    const query = 'DELETE FROM rules WHERE id = ?';
    await db.run(query, [params.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Löschen der Regel' }, { status: 500 });
  }
}

// PUT-Methode: Regel aktualisieren
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const db = await openDB();
    const body = await request.json();
  
    const { trigger_parameter, condition_value, operator, rule_type, affected_value, action } = body;
  
    // Überprüfen, ob alle erforderlichen Felder vorhanden sind
    if (!trigger_parameter || !condition_value || !operator || !rule_type || !affected_value || !action) {
      return NextResponse.json({ error: 'Fehlende erforderliche Felder' }, { status: 400 });
    }
  
    try {
      const query = `
        UPDATE rules 
        SET trigger_parameter = ?, condition_value = ?, operator = ?, rule_type = ?, affected_value = ?, action = ?
        WHERE id = ?
      `;
      await db.run(query, [trigger_parameter, condition_value, operator, rule_type, affected_value, action, params.id]);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Fehler beim Aktualisieren der Regel' }, { status: 500 });
    }
  }