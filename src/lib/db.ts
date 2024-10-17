import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function openDB() {
  const dbPath = process.env.DATABASE_URL || path.join('mnt', 'ycontroldata_settings.db');
  try {
    return await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (error) {
    console.error(`Fehler beim Öffnen der Datenbank unter Pfad: ${dbPath}`, error);
    throw error;
  }
}
