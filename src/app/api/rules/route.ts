import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rules] = await connection.query('SELECT * FROM rules');
    const [bitRules] = await connection.query('SELECT * FROM bit_rules');
    
    // Combine the rules with their bit rules
    const combinedRules = rules.map(rule => {
      if (rule.rule_type === 'bit') {
        rule.bit_rules = bitRules.filter(br => br.rule_id === rule.id);
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

export async function POST(request: Request) {
  const { address, value, text, priority = 'info', rule_type, bit_rules } = await request.json();
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO rules (address, value, text, priority, rule_type) VALUES (?, ?, ?, ?, ?)', 
      [address, value || null, text || null, priority, rule_type]
    );
    const ruleId = result.insertId;

    if (rule_type === 'bit' && bit_rules && Array.isArray(bit_rules)) {
      for (const bitRule of bit_rules) {
        await connection.query(
          'INSERT INTO bit_rules (rule_id, bit_position, text_on, text_off, priority) VALUES (?, ?, ?, ?, ?)',
          [ruleId, bitRule.bit_position, bitRule.text_on, bitRule.text_off, bitRule.priority || 'info']
        );
      }
    }

    await connection.commit();
    return NextResponse.json({ id: ruleId, success: true });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Fehler beim Hinzufügen der Regel:', error);
    return NextResponse.json({ error: 'Fehler beim Hinzufügen der Regel' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}