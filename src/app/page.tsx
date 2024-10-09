// page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Spin, Typography } from 'antd'; // Import Ant Design components
import 'antd/dist/reset.css';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const screens = useBreakpoint(); // Breakpoints for responsive layout

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000); // Simulate loading

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#141414',
        padding: screens.md ? '40px' : '20px',
        textAlign: 'center',
      }}
    >
      {loading ? (
        <Spin size="large" />
      ) : (
        <div style={{ color: 'white' }}>
          <Typography.Title level={screens.md ? 1 : 3} style={{ color: '#1890ff' }}>
            Willkommen auf der Startseite
          </Typography.Title>
          <Typography.Paragraph>Die Seite wurde erfolgreich geladen!</Typography.Paragraph>
        </div>
      )}
    </div>
  );
};

export default HomePage;
