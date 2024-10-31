// src/app/api/rules/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mariadb';

export async function POST(req: NextRequest) {
  try {
    const { address, condition_value, text_in, text_out } = await req.json();

    if (!address || condition_value === undefined || !text_in || !text_out) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    await db.execute(
      'INSERT INTO rules (address, condition_value, text_in, text_out) VALUES (?, ?, ?, ?)',
      [address, condition_value, text_in, text_out]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to add rule' }, { status: 500 });
  }
}
