// /app/api/editors/route.ts
import { NextResponse } from 'next/server';
import { openDB } from '@/lib/db';
export const dynamic = "force-dynamic";  // Verhindert statischen Export
export async function GET() {
  const db = await openDB();
  const editors = await db.all('SELECT DISTINCT EDITOR FROM QHMI_VARIABLES');
  return NextResponse.json(editors);
}
