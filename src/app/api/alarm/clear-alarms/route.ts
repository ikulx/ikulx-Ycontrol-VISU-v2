import { NextResponse } from 'next/server'
import pool from '@/lib/mariadb'

export async function POST() {
  try {
    await pool.query('DELETE FROM active_alarms')
    return NextResponse.json({ message: 'All alarms cleared' })
  } catch (error) {
    console.error('Error clearing alarms:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}