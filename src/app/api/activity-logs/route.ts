import { NextResponse } from 'next/server';
import { getActivityLogs } from '@/lib/alarmProcessor';

export async function GET() {
  try {
    const logs = await getActivityLogs();
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Aktivitätsprotokolle' }, { status: 500 });
  }
}