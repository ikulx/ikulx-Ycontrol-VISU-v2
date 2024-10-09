// /app/api/rules/route.ts
import { NextResponse } from 'next/server';
import { openDB } from '@/lib/db';

// GET-Methode: Regeln abrufen
export async function GET() {
  const db = await openDB();
  
  try {
    // Alle Regeln aus der Datenbank abrufen
    const rules = await db.all('SELECT * FROM rules');
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Abrufen der Regeln' }, { status: 500 });
  }
}

// POST-Methode: Neue Regel erstellen
export async function POST(request: Request) {
  const db = await openDB();
  const body = await request.json();
  
  const { trigger_parameter, condition_value, operator, rule_type, affected_value, action } = body;
  
  // Überprüfen, ob alle erforderlichen Felder vorhanden sind
  if (!trigger_parameter || !condition_value || !operator || !rule_type || !affected_value || !action) {
    return NextResponse.json({ error: 'Fehlende erforderliche Felder' }, { status: 400 });
  }

  const query = `
    INSERT INTO rules (trigger_parameter, condition_value, operator, rule_type, affected_value, action)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  try {
    await db.run(query, [trigger_parameter, condition_value, operator, rule_type, affected_value, action]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Einfügen der Regel in die Datenbank' }, { status: 500 });
  }
}
