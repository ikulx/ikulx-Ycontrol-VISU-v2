import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export async function PUT(request: Request) {
  const { address, name, rules } = await request.json();
  let connection;

  try {
    connection = await pool.getConnection();

    // Aktualisiere den Namen der Adresse
    await connection.query('UPDATE mqtt_data SET name = ? WHERE address = ?', [name, address]);

    // Lösche alle bestehenden Regeln für diese Adresse
    await connection.query('DELETE FROM rules WHERE address = ?', [address]);

    // Füge die neuen Regeln hinzu
    for (const rule of rules) {
      await connection.query('INSERT INTO rules (address, value, text) VALUES (?, ?, ?)', [address, rule.value, rule.text]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Adresse und Regeln:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Adresse und Regeln' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}