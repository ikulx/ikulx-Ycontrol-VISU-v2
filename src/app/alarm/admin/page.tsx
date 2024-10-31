
'use client';

import { useEffect, useState } from 'react';

type Address = {
  address: number;
  name: string;
  value: number;
};

type Rule = {
  id: number;
  address: number;
  condition_value: number;
  text_in: string;
  text_out: string;
};

export default function AdminPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState<Partial<Rule>>({});
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  useEffect(() => {
    // Lade Adressen und Regeln beim Initialisieren der Seite
    const fetchData = async () => {
      try {
        const addressesResponse = await fetch(`${basePath}/api/alarm/addresses`);
        const rulesResponse = await fetch(`${basePath}/api/alarm/rules`);
        const addressesData = await addressesResponse.json();
        const rulesData = await rulesResponse.json();

        setAddresses(addressesData);
        setRules(rulesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Funktion zum Aktualisieren des Namens einer Adresse
  const handleNameChange = async (address: number, name: string) => {
    try {
      const response = await fetch(`${basePath}/api/alarm/update-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, name }),
      });

      if (response.ok) {
        setAddresses((prevAddresses) =>
          prevAddresses.map((a) => (a.address === address ? { ...a, name } : a))
        );
      } else {
        console.error('Failed to update name');
      }
    } catch (error) {
      console.error('Error updating name:', error);
    }
  };

  // Funktion zum Hinzufügen einer neuen Regel
  const handleAddRule = async () => {
    if (!newRule.address || newRule.condition_value === undefined || !newRule.text_in || !newRule.text_out) {
      alert('Please fill in all fields for the new rule');
      return;
    }

    try {
      const response = await fetch(`${basePath}/api/alarm/rules/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });

      if (response.ok) {
        const rule = await response.json();
        setRules((prevRules) => [...prevRules, rule]);
        setNewRule({});
      } else {
        console.error('Failed to add rule');
      }
    } catch (error) {
      console.error('Error adding rule:', error);
    }
  };

  // Benutzeroberfläche
  return (
    <div>
      <h1>Admin: Manage Addresses and Rules</h1>

      <h2>Addresses</h2>
      <ul>
        {addresses.map((address) => (
          <li key={address.address}>
            <strong>Address:</strong> {address.address}
            <input
              type="text"
              value={address.name || ''}
              onChange={(e) => handleNameChange(address.address, e.target.value)}
              placeholder="Enter name"
            />
          </li>
        ))}
      </ul>

      <h2>Rules</h2>
      <table>
        <thead>
          <tr>
            <th>Address</th>
            <th>Condition Value</th>
            <th>Text In</th>
            <th>Text Out</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id}>
              <td>{rule.address}</td>
              <td>{rule.condition_value}</td>
              <td>{rule.text_in}</td>
              <td>{rule.text_out}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Add New Rule</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddRule();
        }}
      >
        <select
          value={newRule.address || ''}
          onChange={(e) => setNewRule({ ...newRule, address: parseInt(e.target.value) })}
        >
          <option value="">Select Address</option>
          {addresses.map((address) => (
            <option key={address.address} value={address.address}>
              {address.address}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Condition Value"
          value={newRule.condition_value || ''}
          onChange={(e) => setNewRule({ ...newRule, condition_value: parseInt(e.target.value) })}
        />
        <input
          type="text"
          placeholder="Text In"
          value={newRule.text_in || ''}
          onChange={(e) => setNewRule({ ...newRule, text_in: e.target.value })}
        />
        <input
          type="text"
          placeholder="Text Out"
          value={newRule.text_out || ''}
          onChange={(e) => setNewRule({ ...newRule, text_out: e.target.value })}
        />
        <button type="submit">Add Rule</button>
      </form>
    </div>
  );
}
