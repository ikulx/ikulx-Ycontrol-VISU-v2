// components/SwissKeyboard.tsx

import React from 'react';
import { Button } from 'antd';

interface SwissKeyboardProps {
  onInput: (value: string) => void;
  onDelete: () => void;
}

export const SwissKeyboard: React.FC<SwissKeyboardProps> = ({ onInput, onDelete }) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P', 'Ü', '+'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ä', '#'],
    ['<', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '-'],
  ];

  // Styling für den gesamten Keyboard-Container
  const keyboardContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)', // 12 Spalten für die erste Reihe
    gap: '8px',
    width: '100%',
    // Entfernen oder erhöhen Sie die maximale Breite
    // maxWidth: '600px', // Vorherige maximale Breite
    // Stattdessen: flex-grow ermöglichen
  };

  // Gemeinsames Styling für alle Tasten
  const keyboardKeyStyle: React.CSSProperties = {
    height: '50px',
    fontSize: '16px',
    borderRadius: '6px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    backgroundColor: '#434343', // Dunkler Hintergrund für Dark Mode
    color: 'white', // Helle Schriftfarbe
    border: '1px solid #555555', // Dunkler Rahmen
    transition: 'background-color 0.2s, transform 0.1s',
    width: '100%',
  };

  // Spezielles Styling für die Löschtaste (über zwei Spalten)
  const deleteKeyStyle: React.CSSProperties = {
    gridColumn: 'span 2',
    backgroundColor: '#ff4d4f', // Rote Hintergrundfarbe
    color: 'white',
  };

  // Funktion zur Behandlung von Mausereignissen für visuelle Effekte
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(2px)';
    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
  };

  return (
    <div style={keyboardContainerStyle}>
      {rows.map((row, rowIndex) => (
        <React.Fragment key={`row-${rowIndex}`}>
          {row.map((key) => (
            <Button
              key={key}
              style={keyboardKeyStyle}
              onClick={() => onInput(key)}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              {key}
            </Button>
          ))}
        </React.Fragment>
      ))}
      <Button
        style={{ ...keyboardKeyStyle, ...deleteKeyStyle }}
        onClick={onDelete}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        Löschen
      </Button>
    </div>
  );
};
