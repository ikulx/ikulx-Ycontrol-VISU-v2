// app/loading.js
'use client';

import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import React from 'react';

const Loading = () => {
  const antIcon = <LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />;

  return (
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
  );
};

export default Loading;
