import { NextResponse } from 'next/server';
import startMqttClientAlarms from '@/lib/mqttClientAlarms';

let mqttClientAlarms: ReturnType<typeof startMqttClientAlarms>;

if (process.env.NODE_ENV !== 'development') {
  mqttClientAlarms = startMqttClientAlarms();
}

export async function GET() {
  return NextResponse.json({ message: 'MQTT-Client für Alarme läuft im Hintergrund' });
}