// Pfad: src\app\editor\[editor]\page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Table, Modal, Input, Select, Button, Typography, Card } from 'antd';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { VirtualKeyboard } from './VirtualKeyboard';  // Importiere die virtuelle Tastatur

const { Option } = Select;

interface DataItem {
  id: number;
  NAME: string;
  VAR_VALUE: string | number;
  TYPE: 'num' | 'text' | 'bool' | 'drop';
  OPTI?: string;
  MIN?: number;
  MAX?: number;
  unit: string;
}

export default function EditorPage() {
  const [data, setData] = useState<DataItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<DataItem | null>(null);
  const [newValue, setNewValue] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const params = useParams();
  const editor = params.editor;

  useEffect(() => {
    // Verwende Server-Sent Events (SSE) für den spezifischen Editor
    const eventSource = new EventSource(`/api/editor/stream/${editor}`);

    eventSource.onmessage = (event) => {
      const updatedData: DataItem[] = JSON.parse(event.data);
      setData(updatedData);
    };

    eventSource.onerror = () => {
      console.error('Fehler beim Empfang der SSE-Daten.');
      eventSource.close(); // Schließe den EventSource-Stream bei einem Fehler
    };

    return () => {
      eventSource.close(); // Stream schließen, wenn die Komponente entfernt wird
    };
  }, [editor]);

  const handleRowClick = (record: DataItem) => {
    setSelectedRow(record);
    setNewValue(record.VAR_VALUE.toString());
    setIsModalVisible(true);
  };

  const handleSave = () => {
    // API-Aufruf zum Aktualisieren von VAR_VALUE
    fetch('/api/editor/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedRow?.id, VAR_VALUE: newValue }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.error) {
          alert('Fehler beim Speichern: ' + result.error);
        } else {
          setIsModalVisible(false);
        }
      })
      .catch((error) => {
        console.error('Fehler beim Speichern:', error);
        alert('Fehler beim Speichern des Werts.');
      });
  };

  const handleKeyboardInput = (input: string) => {
    if (input === '.' && newValue.includes('.')) return;
    if (input === '-' && newValue.includes('-')) return;
    if (input === '-' && newValue !== '0') return;

    setNewValue((prevValue) => (prevValue === '0' && input !== '.' ? input : prevValue + input));
  };

  const handleDeleteInput = () => {
    setNewValue((prevValue) => prevValue.slice(0, -1) || '0');
  };

  const renderValue = (record: DataItem) => {
    if (record.TYPE === 'drop') {
      const selectedOption = record.OPTI?.split(',').find((opt) => opt.startsWith(record.VAR_VALUE as string));
      return selectedOption?.split(':')[1] || record.VAR_VALUE;
    }
    return record.VAR_VALUE;
  };

  return (
    <Card style={{ backgroundColor: '#1f1f1f', color: 'white', width: '100%', maxWidth: '1200px' }}>
      <Typography.Title style={{ color: 'white' }}>Editor: {editor}</Typography.Title>
      <Table
        columns={[
          { title: 'Parameter', dataIndex: 'NAME', key: 'name' },
          {
            title: 'Wert',
            dataIndex: 'VAR_VALUE',
            key: 'var_value',
            render: (text: any, record: DataItem) => (
              <div onClick={() => handleRowClick(record)} style={{ cursor: 'pointer', color: '#1890ff' }}>
                {renderValue(record)}
              </div>
            ),
          },
        ]}
        dataSource={data}
        pagination={false}
        scroll={{ y: 400 }}
        rowKey="id"
      />
      <Modal
        title={selectedRow?.NAME}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
      >
        {selectedRow?.TYPE === 'drop' && (
          <>
            <Select
              value={newValue}
              onChange={(value) => setNewValue(value)}
              style={{ width: '100%' }}
            >
              {selectedRow?.OPTI?.split(',').map((opt) => {
                const [val, label] = opt.split(':');
                return (
                  <Option key={val} value={val}>
                    {label}
                  </Option>
                );
              })}
            </Select>
          </>
        )}
        {selectedRow?.TYPE === 'num' && (
          <>
            <Typography.Title level={4}>{selectedRow.NAME}</Typography.Title>
            <p>Min: {selectedRow.MIN}, Max: {selectedRow.MAX}</p>
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              style={{ width: '100%' }}
            />
            <p>{selectedRow.unit}</p>
            <VirtualKeyboard onInput={handleKeyboardInput} onDelete={handleDeleteInput} />
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <Button
            icon={<CloseOutlined />}
            onClick={() => setIsModalVisible(false)}
            style={{ marginRight: '10px' }}
          >
            Abbrechen
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
          >
            Speichern
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
