import { NextResponse } from 'next/server'
import pool from '@/lib/mariadb'

export async function GET() {
  try {
    const [addresses] = await pool.query('SELECT * FROM addresses')
    const addressesWithRules = await Promise.all(
      addresses.map(async (address) => {
        const [rules] = await pool.query('SELECT * FROM rules WHERE address_id = ?', [address.id])
        return { ...address, rules }
      })
    )
    return NextResponse.json(addressesWithRules)
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { address, name, rules } = await request.json()
    
    // Füge die Adresse hinzu oder aktualisiere sie
    const [result] = await pool.query(
      'INSERT INTO addresses (address, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = ?',
      [address, name, name]
    )
    const addressId = result.insertId || result.insertId === 0 ? result.insertId : (await pool.query('SELECT id FROM addresses WHERE address = ?', [address]))[0][0].id

    // Lösche bestehende Regeln für diese Adresse
    await pool.query('DELETE FROM rules WHERE address_id = ?', [addressId])

    // Füge neue Regeln hinzu
    for (const rule of rules) {
      await pool.query(
        'INSERT INTO rules (address_id, value, message) VALUES (?, ?, ?)',
        [addressId, rule.value, rule.message]
      )
    }

    return NextResponse.json({ id: addressId, address, name, rules })
  } catch (error) {
    console.error('Error creating/updating address:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}