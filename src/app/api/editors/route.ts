// /app/api/editors/route.ts
import { NextResponse } from 'next/server';
import { openDB } from '@/lib/db';

export async function GET() {
  const db = await openDB();
  const editors = await db.all('SELECT DISTINCT EDITOR FROM QHMI_VARIABLES');
  return NextResponse.json(editors);
}
