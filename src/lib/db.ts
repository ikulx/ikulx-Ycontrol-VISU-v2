
// Path: src/lib/db.ts

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function openDB() {
  if (process.env.NODE_ENV === 'production') return null;

  const dbPath = process.env.DATABASE_URL || path.join('mnt', 'ycontroldata_settings.db');
  try {
    return await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (error) {
    console.error(`Failed to open the database at path: ${dbPath}`, error);
    throw error;
  }
}