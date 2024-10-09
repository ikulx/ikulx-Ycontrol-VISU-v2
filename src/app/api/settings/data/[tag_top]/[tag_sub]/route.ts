import { NextResponse } from 'next/server';
import { openDB } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { tag_top: string; tag_sub: string } }) {
  const { tag_top, tag_sub } = params;
  const url = new URL(request.url);
  const user = url.searchParams.get('user');
  const lang = url.searchParams.get('lang') || 'de'; // Standardmäßig 'de', wenn nichts angegeben

  try {
    const db = await openDB();

    // Dekodieren von tag_top und tag_sub
    const decodedTagTop = decodeURIComponent(tag_top);
    const decodedTagSub = decodeURIComponent(tag_sub);

    // Dynamische Felder für die Sprachunterstützung
    const nameField = lang !== 'de' ? `NAME_${lang}` : 'NAME';
    const optiField = lang !== 'de' ? `OPTI_${lang}` : 'OPTI';
    const beschreibungField = lang !== 'de' ? `beschreibung_${lang}` : 'beschreibung';

    // SQL-Abfrage zum Abrufen der Daten, wobei visible = 1 sein muss
    // Wenn die Sprachspalten leer sind, nutzen wir die Standardspalten als Fallback
    const data = await db.all(
      `SELECT id, 
              COALESCE(${nameField}, NAME) AS NAME,
              VAR_VALUE,
              TYPE,
              COALESCE(${optiField}, OPTI) AS OPTI,
              MIN,
              MAX,
              unit,
              COALESCE(${beschreibungField}, beschreibung) AS beschreibung
       FROM QHMI_VARIABLES
       WHERE tag_top = ? AND tag_sub = ? AND visible = 1
       AND (benutzer IS NULL OR benutzer = '' OR benutzer LIKE '%' || ? || '%')`,
      [decodedTagTop, decodedTagSub, user || '']
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fehler beim Abrufen der Daten:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Daten' }, { status: 500 });
  }
}
