// src/app/api/addresses/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/mariadb';

export async function GET() {
  try {
    const [rows] = await db.execute('SELECT * FROM addresses');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}
