'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Typography, Card } from 'antd';

const { Title } = Typography;

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });

    if (response.ok) {
      const { userId } = await response.json();
      localStorage.setItem('user', userId); // Speichere die Benutzer-ID im localStorage
      router.push('/settings'); // Weiterleitung zur Settings-Seite
    } else {
      alert('Login fehlgeschlagen: Falscher PIN');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card style={{ maxWidth: '400px', width: '100%', padding: '20px', textAlign: 'center' }}>
        <Title level={2}>Login mit PIN</Title>
        <Input.Password
          placeholder="Geben Sie Ihren PIN ein"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{ marginBottom: '20px' }}
        />
        <Button type="primary" onClick={handleLogin} block>
          Anmelden
        </Button>
      </Card>
    </div>
  );
}
