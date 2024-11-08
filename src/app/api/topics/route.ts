import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [topics] = await connection.query('SELECT address, name, original_topic FROM mqtt_data');
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Fehler beim Abrufen der Topics:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Topics' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request: Request) {
  const { address, name } = await request.json();
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('UPDATE mqtt_data SET name = ? WHERE address = ?', [name, address]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Namens:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Namens' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}