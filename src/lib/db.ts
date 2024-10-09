import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// SQLite Datenbankverbindung erstellen
export async function openDB() {
  return open({
    filename: './ycontroldata_settings.db', // Speicherort der SQLite-Datenbankdatei
    driver: sqlite3.Database,
  });
}
