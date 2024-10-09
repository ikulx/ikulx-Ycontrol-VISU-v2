import { NextResponse } from 'next/server';
import { openDB } from '../../../../lib/db'; // Verbindung zur SQLite-Datenbank

export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = url.searchParams.get("user");

  try {
    const db = await openDB();

    // Abrufen der einzigartigen Tags (tag_top und tag_sub), wobei der Benutzer berücksichtigt wird
    const tags = await db.all(
      `SELECT DISTINCT tag_top, tag_sub FROM QHMI_VARIABLES 
       WHERE visible = 1 AND (benutzer IS NULL OR benutzer = '' OR benutzer LIKE '%' || ? || '%')`,
      [user]
    );

// Filtere alle Tags, bei denen `tag_top` null oder leer ist
const filteredTags = tags.filter(tag => tag.tag_top !== null && tag.tag_top.trim() !== '');


    return NextResponse.json(filteredTags);
  } catch (error) {
    console.error('Fehler beim Abrufen der Tags:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Tags' }, { status: 500 });
  }
}
