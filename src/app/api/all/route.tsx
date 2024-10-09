
import { NextResponse } from 'next/server';
import { openDB } from '@/lib/db';

export async function GET() {
  const db = await openDB();
  const data = await db.all(`
    SELECT 
      NAME, VAR_VALUE, unit, TYPE, OPTI, MIN, MAX, EDITOR, sort, adresse, faktor 
    FROM QHMI_VARIABLES
  `);
  return NextResponse.json(data);
}
