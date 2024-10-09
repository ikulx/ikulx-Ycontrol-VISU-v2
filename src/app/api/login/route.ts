import { NextResponse } from 'next/server';

// Beispielhafte PINs und die zugehörigen Benutzerrollen
const PIN_TO_USER = {
  '1234': 'admin',
  '5678': 'fachmann',
  '0000': 'benutzer',
} as const;

type PinType = keyof typeof PIN_TO_USER;

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    // Überprüfung des PINs
    if (PIN_TO_USER[pin as PinType]) {
      return NextResponse.json({ userId: PIN_TO_USER[pin as PinType] });
    } else {
      return NextResponse.json({ error: 'Ungültiger PIN' }, { status: 401 });
    }
  } catch (error) {
    console.error('Fehler bei der Anmeldung:', error);
    return NextResponse.json({ error: 'Fehler bei der Anmeldung' }, { status: 500 });
  }
}
