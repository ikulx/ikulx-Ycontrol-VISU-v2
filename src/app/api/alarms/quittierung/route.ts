import { NextResponse } from 'next/server';
import { startQuittierung, getQuittierungStatus } from '@/lib/mqttClientAlarms';
import { clearAlarms, resetValues, quittanceAllAlarms } from '@/lib/alarmProcessor';

export async function POST(request: Request) {
  console.log('Quittierung route called');
  
  if (getQuittierungStatus()) {
    console.log('Quittierung already active');
    return NextResponse.json({ error: 'Quittierung bereits aktiv' }, { status: 400 });
  }

  try {
    console.log('Starting quittierung');
    startQuittierung();

    console.log('Clearing alarms');
    await clearAlarms();

    console.log('Quittancing all alarms');
    await quittanceAllAlarms();

    setTimeout(async () => {
      try {
        console.log('Resetting values');
        await resetValues();
        console.log('Values reset completed');
      } catch (error) {
        console.error('Error resetting values:', error);
      }
    }, 14000);

    console.log('Quittierung process initiated');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error during quittierung:', error);
    return NextResponse.json({ error: 'Fehler beim Quittieren der Alarme' }, { status: 500 });
  }
}