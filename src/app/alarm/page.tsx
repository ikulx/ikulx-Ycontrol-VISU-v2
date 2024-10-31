// src/app/alarm/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Layout,
  Table,
  Button,
  Typography,
  message,
  Alert,
} from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface Entry {
  name: string;
  address: number;
  value: number | null;
  timestamp: string;
  text: string;
  rule_id: number;
  priority: 'prio1' | 'prio2' | 'warn' | 'info';
  status: 'active' | 'inactive';
}

interface EventLogEntry {
  id: number;
  timestamp: string;
  type: string;
  rule_id: number | null;
  text: string;
  name: string | null; // Name aus der addresses-Tabelle
  priority: 'prio1' | 'prio2' | 'warn' | 'info' | null; // Priorität aus rules
}

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [eventLogTotal, setEventLogTotal] = useState<number>(0);
  const [eventLogPage, setEventLogPage] = useState<number>(1);
  const [eventLogLoading, setEventLogLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Event Log with Pagination (useCallback für Stabilität)
  const fetchEventLog = useCallback(async (page: number) => {
    setEventLogLoading(true);
    try {
      const res = await fetch(`${basePath}/api/alarm/event-log?page=${page}&limit=20`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Fehler beim Abrufen des Ereignisprotokolls.');
      }
      const data = await res.json();
      console.log('Fetched event log data:', data); // Debugging
      setEventLog(data.data);
      setEventLogTotal(data.total);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      message.error('Fehler beim Abrufen des Ereignisprotokolls.');
    } finally {
      setEventLogLoading(false);
    }
  }, []);

  // Initiales Laden der Ereignisprotokoll-Tabelle
  useEffect(() => {
    fetchEventLog(eventLogPage);
  }, [fetchEventLog, eventLogPage]);

  // Fetch Active and Inactive Entries (SSE)
  useEffect(() => {
    const eventSource = new EventSource(`${basePath}/api/alarm/sse`);

    eventSource.onmessage = (event) => {
      try {
        const data: EventLogEntry = JSON.parse(event.data);
        console.log('Received SSE data:', data); // Debugging

        // Aktualisieren Sie das eventLog basierend auf den neuen Daten
        setEventLog((prevEventLog) => {
          const existingIndex = prevEventLog.findIndex((entry) => entry.id === data.id);
          if (existingIndex !== -1) {
            // Aktualisiere bestehenden Eintrag
            const updatedEventLog = [...prevEventLog];
            updatedEventLog[existingIndex] = data;
            return updatedEventLog;
          } else {
            // Füge neuen Eintrag hinzu
            return [data, ...prevEventLog];
          }
        });

        // Optional: Trigger event log refresh
        // fetchEventLog(eventLogPage);
      } catch (err: any) {
        console.error('Fehler beim Verarbeiten der SSE-Daten:', err);
        setError('Fehler beim Verarbeiten der SSE-Daten.');
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Fehler:', error);
      message.error('Verbindung zum Server unterbrochen.');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [basePath, fetchEventLog, eventLogPage]);

  const handleReset = async () => {
    try {
      const res = await fetch(`${basePath}/api/reset`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Fehler beim Zurücksetzen der Einträge.');
      }

      // Nur die aktiven/inaktiven Einträge leeren
      setEntries([]);
      // Ereignisprotokoll neu laden
      fetchEventLog(eventLogPage);

      message.success('Einträge erfolgreich zurückgesetzt.');
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      message.error('Fehler beim Zurücksetzen der Einträge.');
    }
  };

  // Definieren der Spalten für die aktiven/inaktiven Einträge
  const activeInactiveColumns = [
    {
      title: 'Zeitpunkt',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString(),
      sorter: (a: Entry, b: Entry) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Entry, b: Entry) => {
        if (a.name && b.name) {
          return a.name.localeCompare(b.name);
        }
        return 0;
      },
      render: (text: string | null) => text || '-', // Zeigt '-' an, wenn name null ist
    },
    {
      title: 'Text',
      dataIndex: 'text',
      key: 'text',
      sorter: (a: Entry, b: Entry) => a.text.localeCompare(b.text),
    },
    {
      title: 'Priorität',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a: Entry, b: Entry) => a.priority.localeCompare(b.priority),
      filters: [
        { text: 'Prio1', value: 'prio1' },
        { text: 'Prio2', value: 'prio2' },
        { text: 'Warn', value: 'warn' },
        { text: 'Info', value: 'info' },
      ],
      onFilter: (value: string, record: Entry) => record.priority === value,
      render: (priority: string) => {
        if (!priority) return '-';
        let color = 'gray';
        if (priority === 'prio1') color = 'red';
        if (priority === 'prio2') color = 'orange';
        if (priority === 'warn') color = 'yellow';
        if (priority === 'info') color = 'blue';
        return <span style={{ color }}>{priority.toUpperCase()}</span>;
      },
    },
  ];

  // Definieren der Spalten für das Ereignisprotokoll
  const eventLogColumns = [
    {
      title: 'Zeitpunkt',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString(),
      sorter: (a: EventLogEntry, b: EventLogEntry) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: 'Name',
      dataIndex: 'name', // Verwenden Sie 'name' statt 'rule_name'
      key: 'name',
      render: (text: string | null) => text || '-', // Zeigt '-' an, wenn name null ist
      sorter: (a: EventLogEntry, b: EventLogEntry) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: 'Text',
      dataIndex: 'text',
      key: 'text',
      sorter: (a: EventLogEntry, b: EventLogEntry) => a.text.localeCompare(b.text),
    },
    {
      title: 'Priorität',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string | null) => {
        if (!priority) return '-';
        let color = 'gray';
        if (priority === 'prio1') color = 'red';
        if (priority === 'prio2') color = 'orange';
        if (priority === 'warn') color = 'yellow';
        if (priority === 'info') color = 'blue';
        return <span style={{ color }}>{priority.toUpperCase()}</span>;
      },
      sorter: (a: EventLogEntry, b: EventLogEntry) => {
        const priorityA = a.priority || '';
        const priorityB = b.priority || '';
        return priorityA.localeCompare(priorityB);
      },
      filters: [
        { text: 'Prio1', value: 'prio1' },
        { text: 'Prio2', value: 'prio2' },
        { text: 'Warn', value: 'warn' },
        { text: 'Info', value: 'info' },
      ],
      onFilter: (value: string, record: EventLogEntry) => record.priority === value,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ margin: '16px' }}>
        <Title level={2}>Aktuelle Ereignisse</Title>
        <Button type="primary" danger onClick={handleReset} style={{ marginBottom: '16px' }}>
          Einträge zurücksetzen
        </Button>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '16px' }} />}

        {/* Aktive und Inaktive Einträge */}
        <Title level={4}>Aktive und Inaktive Einträge</Title>
        <Table
          dataSource={entries}
          rowKey="rule_id" // Eindeutiger Schlüssel basierend auf rule_id
          pagination={false}
          columns={activeInactiveColumns}
          bordered
          style={{ marginBottom: '24px' }}
        />

        {/* Ereignisprotokoll */}
        <Title level={4}>Ereignisprotokoll</Title>
        <Table
          dataSource={eventLog}
          rowKey="id"
          columns={eventLogColumns}
          pagination={{
            current: eventLogPage,
            pageSize: 20,
            total: eventLogTotal,
            onChange: (page) => setEventLogPage(page),
            showSizeChanger: false,
          }}
          loading={eventLogLoading}
          bordered
        />
      </Content>
    </Layout>
  );
}
