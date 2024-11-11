import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM alarms ORDER BY timestamp DESC');
    connection.release();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching alarms:', error);
    return NextResponse.json({ error: 'Error fetching alarms' }, { status: 500 });
  }
}