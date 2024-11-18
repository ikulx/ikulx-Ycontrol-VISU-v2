// Pfad: src\app\alarms\page.tsx

'use client'

import { useState, useEffect } from 'react';
import { Table, Button, message, Spin, Progress, Select } from 'antd';
import { LoadingOutlined, WarningOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface AlarmData {
  id: number;
  address: number;
  address_name: string;
  new_value: string;
  timestamp: number;
  text: string;
  priority: 'prio1' | 'prio2' | 'prio3' | 'warnung' | 'info';
}

interface AllAlarmData extends AlarmData {
  quittanced: boolean;
  quittanced_at: number | null;
  entry_type: 'alarm' | 'quittance';
}

export default function AlarmManagerPage() {
  const [alarms, setAlarms] = useState<AlarmData[]>([]);
  const [allAlarms, setAllAlarms] = useState<AllAlarmData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  

  useEffect(() => {
    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const connectSSE = () => {
    const newEventSource = new EventSource(`${basePath}/api/alarms/sse`);

    newEventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setAlarms(data.currentAlarms);
      setAllAlarms(data.allAlarms);
    };

    newEventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      newEventSource.close();
      setTimeout(connectSSE, 5000);
    };

    setEventSource(newEventSource);
  };

  const handleQuittierung = async () => {
    setIsLoading(true);
    setProgress(0);
    try {
      console.log('Sending quittierung request to:', `${basePath}/api/alarms/quittierung`);
      const response = await fetch(`${basePath}/api/alarms/quittierung`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        // message.success('Alarme wurden quittiert. Alle Werte werden in 14 Sekunden zurückgesetzt.');
        // Start progress bar
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + (100 / 14);
          });
        }, 1000);

        // Wait for 15 seconds (14 seconds for reset + 1 second buffer)
        await new Promise(resolve => setTimeout(resolve, 15000));
        clearInterval(interval);
        setProgress(0);
        message.success('Alle Werte wurden zurückgesetzt');
      } else {
        message.error(responseData.error || 'Fehler beim Quittieren der Alarme');
      }
    } catch (error) {
      console.error('Fehler beim Quittieren:', error);
      message.error('Fehler beim Quittieren der Alarme');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'prio1':
        return <><ExclamationCircleOutlined style={{ color: 'red' }} /> 1</>;
      case 'prio2':
        return <><ExclamationCircleOutlined style={{ color: 'red' }} /> 2</>;
      case 'prio3':
        return <><ExclamationCircleOutlined style={{ color: 'red' }} /> 3</>;
      case 'warnung':
        return <WarningOutlined style={{ color: 'yellow' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: 'blue' }} />;
      default:
        return null;
    }
  };

  const columns = [
    {
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      },
      width: '20%',
    },
    {
      dataIndex: 'address_name',
      key: 'address_name',
      width: '20%',
    },
    {
      dataIndex: 'text',
      key: 'text',
      width: '50%',
    },
    {
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => getPriorityIcon(priority),
      width: '10%',
    },
  ];

  const allAlarmsColumns = [
    {
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      },
      width: '20%',
    },
    {
      dataIndex: 'address_name',
      key: 'address_name',
      render: (text: string, record: AllAlarmData) => record.entry_type === 'alarm' ? text : '-',
      width: '20%',
    },
    {
      dataIndex: 'text',
      key: 'text',
      width: '50%',
    },
    {
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => priority ? getPriorityIcon(priority) : '-',
      width: '10%',
    },
  ];

  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  const filteredAlarms = alarms.filter(alarm => priorityFilter.length === 0 || priorityFilter.includes(alarm.priority));
  const filteredAllAlarms = allAlarms.filter(alarm => priorityFilter.length === 0 || priorityFilter.includes(alarm.priority));

  return (
    <div style={{ padding: '12px', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          onClick={handleQuittierung} 
          disabled={isLoading}
          style={{ width: '200px' }}
          danger
        >
          {isLoading ? <Spin indicator={antIcon} /> : 'Reset'}
        </Button>
        <Select
          mode="multiple"
          style={{ width: '300px' }}
          placeholder="Filter nach Priorität"
          onChange={setPriorityFilter}
          value={priorityFilter}
        >
          <Option value="prio1"><ExclamationCircleOutlined style={{ color: 'red' }} /> 1</Option>
          <Option value="prio2"><ExclamationCircleOutlined style={{ color: 'red' }} /> 2</Option>
          <Option value="prio3"><ExclamationCircleOutlined style={{ color: 'red' }} /> 3</Option>
          <Option value="warnung"><WarningOutlined style={{ color: 'yellow' }} /> Warnung</Option>
          <Option value="info"><InfoCircleOutlined style={{ color: 'blue' }} /> Info</Option>
        </Select>
      </div>
      {progress > 0 && <Progress percent={Math.round(progress)} status="active" />}
      
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, marginRight: '12px', overflow: 'hidden' }}>
          <Table 
            columns={columns} 
            dataSource={filteredAlarms} 
            rowKey="id" 
            pagination={false}
            scroll={{ y: 'calc(100vh - 120px)' }}
            showHeader={false}
          />
        </div>
        <div style={{ flex: 1, marginLeft: '12px', overflow: 'hidden' }}>
          <Table 
            columns={allAlarmsColumns} 
            dataSource={filteredAllAlarms} 
            rowKey="id" 
            pagination={false}
            scroll={{ y: 'calc(100vh - 120px)' }}
            showHeader={false}
          />
        </div>
      </div>
    </div>
  );
}