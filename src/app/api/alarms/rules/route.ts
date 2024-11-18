import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

interface Rule {
  id?: number;
  address: string;
  value: string | null;
  text: string | null;
  priority: string;
  rule_type: string;
  bit_rules?: BitRule[];
}

interface BitRule {
  id?: number;
  rule_id?: number;
  bit_position: number;
  text_on: string;
  text_off: string;
  priority: string;
}

// GET: Alle Regeln abrufen
export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rules] = await connection.query('SELECT * FROM rules');
    const [bitRules] = await connection.query('SELECT * FROM bit_rules');

    const combinedRules = rules.map((rule: Rule) => {
      if (rule.rule_type === 'bit') {
        rule.bit_rules = bitRules.filter((br: BitRule) => br.rule_id === rule.id);
      }
      return rule;
    });

    return NextResponse.json(combinedRules);
  } catch (error) {
    console.error('Fehler beim Abrufen der Regeln:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Regeln' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// POST: Neue Regel hinzufügen
export async function POST(request: Request) {
  const { address, value, text, priority, rule_type, bit_rules } = await request.json();
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO rules (address, value, text, priority, rule_type) VALUES (?, ?, ?, ?, ?)',
      [address, value || null, text || null, priority, rule_type]
    );

    const ruleId = (result as any).insertId;

    if (rule_type === 'bit' && Array.isArray(bit_rules)) {
      for (const bitRule of bit_rules) {
        await connection.query(
          'INSERT INTO bit_rules (rule_id, bit_position, text_on, text_off, priority) VALUES (?, ?, ?, ?, ?)',
          [ruleId, bitRule.bit_position, bitRule.text_on, bitRule.text_off, bitRule.priority]
        );
      }
    }

    await connection.commit();
    return NextResponse.json({ success: true, ruleId });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Fehler beim Hinzufügen der Regel:', error);
    return NextResponse.json({ error: 'Fehler beim Hinzufügen der Regel' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// PUT: Regel aktualisieren
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
      await connection.query('DELETE FROM bit_rules WHERE rule_id = ?', [params.id]);

      if (bit_rules && Array.isArray(bit_rules)) {
        for (const bitRule of bit_rules) {
          await connection.query(
            'INSERT INTO bit_rules (rule_id, bit_position, text_on, text_off, priority) VALUES (?, ?, ?, ?, ?)',
            [params.id, bitRule.bit_position, bitRule.text_on, bitRule.text_off, bitRule.priority]
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

// DELETE: Regel löschen
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query('DELETE FROM bit_rules WHERE rule_id = ?', [params.id]);
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
