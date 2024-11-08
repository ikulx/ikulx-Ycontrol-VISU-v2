'use client'

import { useState, useEffect } from 'react';
import { Table } from 'antd';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface AlarmData {
  id: number;
  address: number;
  name: string;
  old_value: string;
  new_value: string;
  timestamp: number;
  text: string;
}

export default function AlarmManagerPage() {
  const [alarms, setAlarms] = useState<AlarmData[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(`${basePath}/api/alarms/sse`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setAlarms(data);
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const columns = [
    {
      title: 'Zeit',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Text',
      dataIndex: 'text',
      key: 'text',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Alarme</h1>
      <Table columns={columns} dataSource={alarms} rowKey="id" />
    </div>
  );
}