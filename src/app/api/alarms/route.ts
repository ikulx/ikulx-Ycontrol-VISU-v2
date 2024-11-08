import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [alarms] = await connection.query(`
      SELECT a.id, a.address, m.name, a.new_value as value, a.timestamp, a.text
      FROM alarms a
      JOIN mqtt_data m ON a.address = m.address
      ORDER BY a.timestamp DESC
      LIMIT 100
    `);
    return NextResponse.json(alarms);
  } catch (error) {
    console.error('Fehler beim Abrufen der Alarme:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Alarme' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}