import startMqttClientAlarms from '@/lib/mqttClientAlarms';

export function GET() {
  startMqttClientAlarms();

  return new Response('MQTT client started', { status: 200 });
}