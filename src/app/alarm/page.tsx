


'use client';

import { useEffect, useState } from 'react';

type AddressData = {
  address: number;
  name: string;
  value: number;
  ruleTexts: string[]; // Die Regeltexte, die angezeigt werden sollen
};

export default function IndexPage() {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  useEffect(() => {
    // Erstelle eine Verbindung zur SSE-API
    const eventSource = new EventSource(`${basePath}/api/alarm/sse`);

    eventSource.onmessage = (event) => {
      console.log('Received data:', event.data);
      try {
        const data = JSON.parse(event.data);
        setAddresses(data);
      } catch (error) {
        console.error('Error parsing data:', error);
      }
    };

    // Schließe die Verbindung, wenn die Komponente unmontiert wird
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <h1>Address Overview with Rules</h1>
      <ul>
        {addresses.length > 0 ? (
          addresses.map((address) => (
            <li key={address.address}>
              <strong>{address.name}</strong> (Value: {address.value})
              <ul>
                {/* Überprüfe, ob ruleTexts ein Array ist, bevor du map() aufrufst */}
                {Array.isArray(address.ruleTexts) ? (
                  address.ruleTexts.map((text, index) => <li key={index}>{text}</li>)
                ) : (
                  <li>No rules available</li>
                )}
              </ul>
            </li>
          ))
        ) : (
          <p>No addresses with names and rules available.</p>
        )}
      </ul>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';

type AddressData = {
  address: number;
  name: string;
  value: number;
  ruleText: string; // Nur ein Regeltext wird angezeigt
};

export default function IndexPage() {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  useEffect(() => {
    // Erstelle eine Verbindung zur SSE-API
    const eventSource = new EventSource('/api/sse');

    eventSource.onmessage = (event) => {
      console.log('Received data:', event.data);
      try {
        const data = JSON.parse(event.data);
        setAddresses(data);
      } catch (error) {
        console.error('Error parsing data:', error);
      }
    };

    // Schließe die Verbindung, wenn die Komponente unmontiert wird
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <h1>Address Overview with Rules</h1>
      <ul>
        {addresses.length > 0 ? (
          addresses.map((address) => (
            <li key={address.address}>
              <strong>{address.name}</strong> (Value: {address.value})
              <p>{address.ruleText}</p>
            </li>
          ))
        ) : (
          <p>No addresses with names and rules available.</p>
        )}
      </ul>
    </div>
  );
}
