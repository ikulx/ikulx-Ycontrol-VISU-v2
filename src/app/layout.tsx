'use client';

import 'antd/dist/reset.css'; // Ant Design reset styles
import { ConfigProvider, Spin } from 'antd'; 
import { LoadingOutlined } from '@ant-design/icons';
import './globals.css'; // Custom global styles
import { useState, useEffect, ReactNode } from 'react';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';

interface LayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  const [loading, setLoading] = useState(true);
  const screens = useBreakpoint(); // Responsive handling

  useEffect(() => {
    const handleLoad = () => {
      // Nachdem alle Ressourcen (einschließlich CSS) geladen wurden
      setLoading(false);
    };

    // Überwache das Laden des CSS und anderer Ressourcen
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Cleanup des Event Listeners, falls die Komponente unmontiert wird
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // Ladeanimation Icon
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
      <body style={{overflow: "hidden"}}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1890ff', // Ant Design Primary color
              colorBgBase: '#141414', // Background color for Dark Mode
              colorTextBase: '#ffffff', // Text color in Dark Mode
            },
          }}
        >
          <div style={{ padding: screens.md ? '20px' : '10px', backgroundColor: '#141414', minHeight: '100vh' }}>
            {children}
          </div>
        </ConfigProvider>
      </body>
    </html>
  );
}
