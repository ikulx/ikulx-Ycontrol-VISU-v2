// Dies ist eine Server-Komponente (kein 'use client')
import HklClientComponent from './HklClientComponent';
import { openDB } from '@/lib/db';

// button1 = VL Auslegepunkt
// button2 = VL Fusspunkt
// button3 = AT Fusspunkt
// button4 = Hiezgrenze
// button5 = AT Auslegepunkt
// button6 = Totband
// button7 = Sollwert Normal
// button8 = Sollwert Reduziert

// ID 10 = VL MIN
// ID 11 = VL MAX

// ID 20 = Kühlen

interface DataItem {
  id: number;
  NAME: string;
  VAR_VALUE: string | number;
  unit: string | null;
  HKL_Feld: string;
  MIN?: number;
  MAX?: number;
  OPTI?: string;
  TYPE?: string;
}

export default async function HklPage({ params }: { params: { hklId: string } }) {
  const { hklId } = params;

  try {
    const db = await openDB();

    // Daten aus der Datenbank abrufen
    const data: DataItem[] = await db.all(
      `SELECT id, NAME, VAR_VALUE, unit, HKL_Feld, MIN, MAX, OPTI, TYPE
       FROM QHMI_VARIABLES 
       WHERE HKL = ?`,
      [hklId]
    );

    return <HklClientComponent data={data} hklId={hklId} />;
  } catch (error) {
    console.error('Fehler beim Abrufen der Daten:', error);
    return <div>Fehler beim Abrufen der Daten</div>;
  }
}
