// src/app/api/update-name/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mariadb';

export async function POST(req: NextRequest) {
  try {
    const { address, name } = await req.json();

    if (!address || !name) {
      return NextResponse.json({ error: 'Address and name are required' }, { status: 400 });
    }

    await db.execute('UPDATE addresses SET name = ? WHERE address = ?', [name, address]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database update error:', error);
    return NextResponse.json({ error: 'Failed to update name' }, { status: 500 });
  }
}
