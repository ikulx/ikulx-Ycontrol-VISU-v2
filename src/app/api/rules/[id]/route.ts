import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { address, value, text } = await request.json();
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('UPDATE rules SET address = ?, value = ?, text = ? WHERE id = ?', [address, value, text, params.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Regel:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Regel' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('DELETE FROM rules WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Regel:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Regel' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}