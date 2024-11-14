// Pfad: src\app\api\data\[editor]\route.ts
import { NextResponse } from 'next/server';
import { openDB } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { editor: string } }) {
  const editor = params.editor;
  const db = await openDB();
  
  // Query, um alle Daten basierend auf dem Editor abzurufen
  const query = `
    SELECT id, NAME, VAR_VALUE, TYPE, OPTI, MIN, MAX, sort, unit, adresse, faktor, HKL, HKL_Feld 
    FROM QHMI_VARIABLES 
    WHERE EDITOR = ? 
    ORDER BY sort ASC`;
  
  const data = await db.all(query, [editor]);

  return NextResponse.json(data);
}
