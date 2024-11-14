// src/app/api/rules/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';
import { RowDataPacket, FieldPacket, ResultSetHeader } from 'mysql2/promise';

interface Rule extends RowDataPacket {
  id: number;
  address: string;
  value: string | null;
  text: string | null;
  priority: string;
  rule_type: string;
  bit_rules?: BitRule[];
}

interface BitRule extends RowDataPacket {
  id: number;
  rule_id: number;
  bit_position: number;
  text_on: string;
  text_off: string;
  priority: string;
}

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Typen explizit ohne generische Angabe für query deklarieren
    const [rules] = await connection.query('SELECT * FROM rules') as [Rule[], FieldPacket[]];
    const [bitRules] = await connection.query('SELECT * FROM bit_rules') as [BitRule[], FieldPacket[]];

    // Kombinieren der Regeln mit ihren Bit-Regeln
    const combinedRules = rules.map((rule) => {
      if (rule.rule_type === 'bit') {
        rule.bit_rules = bitRules.filter((br) => br.rule_id === rule.id);
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
