// app/api/admin/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/mariadb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'get-addresses') {
      const [rows] = await pool.query('SELECT * FROM addresses');
      return NextResponse.json(rows);
    } else if (action === 'get-rules') {
      const [rows] = await pool.query('SELECT * FROM rules');
      return NextResponse.json(rows);
    } else {
      return new NextResponse('Ungültige Aktion', { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return new NextResponse('Fehler beim Verarbeiten der Anfrage', { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const body = await request.json();

    if (action === 'add-address') {
      const { address, name, rule_type } = body;
      if (!['standard', 'bit'].includes(rule_type)) {
        return new NextResponse('Ungültiger rule_type', { status: 400 });
      }
      await pool.query('INSERT INTO addresses (address, name, rule_type) VALUES (?, ?, ?)', [address, name, rule_type]);
      return new NextResponse('Adresse hinzugefügt', { status: 200 });
    } else if (action === 'add-rule') {
      const { address, type, value, bit_number, text, text_unfulfilled, text_on, text_off, priority } = body;

      if (!['prio1', 'prio2', 'warn', 'info'].includes(priority)) {
        return new NextResponse('Ungültige Priorität', { status: 400 });
      }

      if (type === 'standard') {
        // Validierung für Standard-Regeln
        if (value === undefined || text === undefined || text_unfulfilled === undefined) {
          return new NextResponse('Fehlende Felder für Standard-Regel', { status: 400 });
        }
        await pool.query(
          'INSERT INTO rules (address, type, value, text, text_unfulfilled, priority) VALUES (?, ?, ?, ?, ?, ?)',
          [address, type, value, text, text_unfulfilled, priority]
        );
      } else if (type === 'bit') {
        // Validierung für Bit-Regeln
        if (bit_number === undefined || text_on === undefined || text_off === undefined) {
          return new NextResponse('Fehlende Felder für Bit-Regel', { status: 400 });
        }
        if (bit_number < 0 || bit_number > 15) {
          return new NextResponse('bit_number muss zwischen 0 und 15 liegen', { status: 400 });
        }
        await pool.query(
          'INSERT INTO rules (address, type, bit_number, text_on, text_off, priority) VALUES (?, ?, ?, ?, ?, ?)',
          [address, type, bit_number, text_on, text_off, priority]
        );
      } else {
        return new NextResponse('Ungültiger Regeltyp', { status: 400 });
      }

      // Abrufen der neu hinzugefügten Regel
      const [result] = type === 'standard'
        ? await pool.query('SELECT * FROM rules WHERE address = ? AND type = "standard" AND value = ? ORDER BY id DESC LIMIT 1', [address, value])
        : await pool.query('SELECT * FROM rules WHERE address = ? AND type = "bit" AND bit_number = ? ORDER BY id DESC LIMIT 1', [address, bit_number]);

      return NextResponse.json(result[0]);
    } else if (action === 'delete-rule') {
      const { id } = body;
      await pool.query('DELETE FROM rules WHERE id = ?', [id]);
      return new NextResponse('Regel gelöscht', { status: 200 });
    } else if (action === 'update-rule') {
      const { id, address, type, value, bit_number, text, text_unfulfilled, text_on, text_off, priority } = body;

      if (!['prio1', 'prio2', 'warn', 'info'].includes(priority)) {
        return new NextResponse('Ungültige Priorität', { status: 400 });
      }

      if (type === 'standard') {
        if (value === undefined || text === undefined || text_unfulfilled === undefined) {
          return new NextResponse('Fehlende Felder für Standard-Regel', { status: 400 });
        }
        await pool.query(
          `UPDATE rules SET 
            address = ?, 
            type = ?, 
            value = ?, 
            text = ?, 
            text_unfulfilled = ?, 
            priority = ? 
            WHERE id = ?`,
          [address, type, value, text, text_unfulfilled, priority, id]
        );
      } else if (type === 'bit') {
        if (bit_number === undefined || text_on === undefined || text_off === undefined) {
          return new NextResponse('Fehlende Felder für Bit-Regel', { status: 400 });
        }
        if (bit_number < 0 || bit_number > 15) {
          return new NextResponse('bit_number muss zwischen 0 und 15 liegen', { status: 400 });
        }
        await pool.query(
          `UPDATE rules SET 
            address = ?, 
            type = ?, 
            bit_number = ?, 
            text_on = ?, 
            text_off = ?, 
            priority = ? 
            WHERE id = ?`,
          [address, type, bit_number, text_on, text_off, priority, id]
        );
      } else {
        return new NextResponse('Ungültiger Regeltyp', { status: 400 });
      }

      // Abrufen der aktualisierten Regel
      const [result] = await pool.query('SELECT * FROM rules WHERE id = ?', [id]);
      return NextResponse.json(result[0]);
    } else if (action === 'update-address-rule-type') {
      const { address, rule_type } = body;
      if (!['standard', 'bit'].includes(rule_type)) {
        return new NextResponse('Ungültiger rule_type', { status: 400 });
      }
      await pool.query('UPDATE addresses SET rule_type = ? WHERE address = ?', [rule_type, address]);
      return new NextResponse('Rule Type aktualisiert', { status: 200 });
    } else {
      return new NextResponse('Ungültige Aktion', { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return new NextResponse('Fehler beim Verarbeiten der Anfrage', { status: 500 });
  }
}
