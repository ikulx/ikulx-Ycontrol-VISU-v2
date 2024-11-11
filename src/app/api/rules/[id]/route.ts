import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { address, value, text, priority, rule_type, bit_rules } = await request.json();
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(
      'UPDATE rules SET address = ?, value = ?, text = ?, priority = ?, rule_type = ? WHERE id = ?', 
      [address, value || null, text || null, priority, rule_type, params.id]
    );

    if (rule_type === 'bit') {
      // Delete existing bit rules
      await connection.query('DELETE FROM bit_rules WHERE rule_id = ?', [params.id]);
      
      // Insert new bit rules
      if (bit_rules && Array.isArray(bit_rules)) {
        for (const bitRule of bit_rules) {
          await connection.query(
            'INSERT INTO bit_rules (rule_id, bit_position, text_on, text_off, priority) VALUES (?, ?, ?, ?, ?)',
            [params.id, bitRule.bit_position, bitRule.text_on, bitRule.text_off, bitRule.priority || 'info']
          );
        }
      }
    }

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (connection) await connection.rollback();
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
    await connection.beginTransaction();

    // Delete associated bit rules first
    await connection.query('DELETE FROM bit_rules WHERE rule_id = ?', [params.id]);

    // Then delete the main rule
    await connection.query('DELETE FROM rules WHERE id = ?', [params.id]);

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Fehler beim Löschen der Regel:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Regel' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}