'use client';

import 'antd/dist/reset.css'; // Ant Design reset styles
import { ConfigProvider, Spin, theme } from 'antd'; 
import { LoadingOutlined } from '@ant-design/icons';
import './globals.css'; // Custom global styles
import { useState, useEffect, ReactNode } from 'react';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';

// Importiere den MQTT-Client nur, wenn wir uns auf der Serverseite befinden
if (typeof window === 'undefined') {
  require('@/lib/mqttClient'); // Importiere mqttClient.ts nur auf dem Server
}

interface LayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  const [loading, setLoading] = useState(true);
  const screens = useBreakpoint(); // Responsive handling
  
  const { darkAlgorithm } = theme;

  useEffect(() => {
    const handleLoad = () => {
      // Nachdem alle Ressourcen (einschließlich CSS) geladen wurden
      setLoading(false);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  const antIcon = <LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />;

  if (loading) {
    return (
      <html lang="en">
        <body>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            backgroundColor: '#141414', 
            color: '#ffffff'
          }}>
            <Spin indicator={antIcon} />
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>Ycontrol</title>
      </head>
      <ConfigProvider
        theme={{
          algorithm: darkAlgorithm,
          token: {
            colorBgBase: '#141414',
          },
        }}
      >
        <body style={{ margin: 0, padding: 0, backgroundColor: '#141414', minHeight: '100vh' }}>
          {children}
        </body>
      </ConfigProvider>
    </html>
  );
}