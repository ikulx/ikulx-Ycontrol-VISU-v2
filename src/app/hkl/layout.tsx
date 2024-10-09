import React from 'react';
import 'antd/dist/reset.css';
import { Layout, Menu } from 'antd';
import Link from 'next/link';

const { Header, Content, Footer } = Layout;

export const metadata = {
  title: 'HKL App',
  description: 'HKL management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Layout>
          <Header>
            <Menu theme="dark" mode="horizontal">
              <Menu.Item key="hkl">
                <Link href="/hkl">HKL</Link>
              </Menu.Item>
              <Menu.Item key="admin">
                <Link href="/admin">Admin</Link>
              </Menu.Item>
            </Menu>
          </Header>
          <Content style={{ padding: '0 50px' }}>
            <div style={{ background: '#fff', padding: 24, minHeight: 380 }}>
              {children}
            </div>
          </Content>
          <Footer style={{ textAlign: 'center' }}>HKL App ©2024</Footer>
        </Layout>
      </body>
    </html>
  );
}
