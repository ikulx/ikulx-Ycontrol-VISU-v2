import { NextResponse } from 'next/server'
import pool from '@/lib/mariadb'

export async function GET() {
  const encoder = new TextEncoder()
  let intervalId: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    async start(controller) {
      intervalId = setInterval(async () => {
        try {
          const [rows] = await pool.query(`
            SELECT 
              aa.id,
              aa.timestamp,
              a.name AS address_name,
              a.address,
              aa.rule_text,
              aa.value
            FROM active_alarms aa
            JOIN addresses a ON aa.address_id = a.id
            ORDER BY aa.timestamp DESC
          `)

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(rows)}\n\n`))
        } catch (error) {
          console.error('Error fetching active alarms:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify([])}\n\n`))
        }
      }, 5000)
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}