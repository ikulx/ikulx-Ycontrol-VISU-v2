import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [allAlarms] = await connection.query('SELECT * FROM all_alarms ORDER BY timestamp DESC');
    return NextResponse.json(allAlarms);
  } catch (error) {
    console.error('Error fetching all alarms:', error);
    return NextResponse.json({ error: 'Error fetching all alarms' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}