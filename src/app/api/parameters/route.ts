// /app/api/parameters/route.ts
import { NextResponse } from 'next/server';
import { openDB } from '@/lib/db';
export const dynamic = "force-dynamic";  // Verhindert statischen Export
export async function GET() {
  const db = await openDB();
  const params = await db.all('SELECT NAME FROM QHMI_VARIABLES');
  return NextResponse.json(params);
}
