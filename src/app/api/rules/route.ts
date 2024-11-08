import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rules] = await connection.query('SELECT * FROM rules');
    return NextResponse.json(rules);
  } catch (error) {
    console.error('Fehler beim Abrufen der Regeln:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Regeln' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request: Request) {
  const { address, value, text } = await request.json();
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query('INSERT INTO rules (address, value, text) VALUES (?, ?, ?)', [address, value, text]);
    return NextResponse.json({ id: result.insertId, success: true });
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Regel:', error);
    return NextResponse.json({ error: 'Fehler beim Hinzufügen der Regel' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}