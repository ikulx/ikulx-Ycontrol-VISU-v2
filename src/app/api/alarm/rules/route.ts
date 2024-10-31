// src/app/api/rules/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/mariadb';

export async function GET() {
  try {
    const [rows] = await db.execute('SELECT * FROM rules');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}
