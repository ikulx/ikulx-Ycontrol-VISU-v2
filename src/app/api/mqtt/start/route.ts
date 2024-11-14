import { NextResponse } from 'next/server';
import startMqttClientAlarms from '@/lib/mqttClientAlarms';
let mqttClientAlarms: ReturnType<typeof startMqttClientAlarms>;
export async function GET() {
  if (!mqttClientAlarms) {
    mqttClientAlarms = startMqttClientAlarms();
    return NextResponse.json({ message: 'MQTT-Client für Alarme wurde gestartet' });
  } else {
    return NextResponse.json({ message: 'MQTT-Client für Alarme läuft bereits' });
  }
}