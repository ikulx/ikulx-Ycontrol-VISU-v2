'use client'

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface TopicData {
  address: number;
  name: string;
  original_topic: string;
}

interface RuleData {
  id?: number;
  address: number;
  value: string;
  text: string;
}

export default function AlarmAdminPage() {
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [rules, setRules] = useState<RuleData[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTopics();
    fetchRules();
  }, []);

  const fetchTopics = async () => {
    const response = await fetch(`${basePath}/api/topics`);
    const data = await response.json();
    setTopics(data);
  };

  const fetchRules = async () => {
    const response = await fetch(`${basePath}/api/rules`);
    const data = await response.json();
    setRules(data);
  };

  const handleNameChange = async (address: number, newName: string) => {
    try {
      await fetch(`${basePath}/api/topics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, name: newName }),
      });
      message.success('Name erfolgreich aktualisiert');
      fetchTopics();
    } catch (error) {
      message.error('Fehler beim Aktualisieren des Namens');
    }
  };

  const handleAddRule = async (values: RuleData) => {
    try {
      await fetch(`${basePath}/api/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      message.success('Regel erfolgreich hinzugefügt');
      fetchRules();
    } catch (error) {
      message.error('Fehler beim Hinzufügen der Regel');
    }
  };

  const handleEditRule = async (values: RuleData) => {
    try {
      await fetch(`${basePath}/api/rules/${values.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      message.success('Regel erfolgreich aktualisiert');
      fetchRules();
    } catch (error) {
      message.error('Fehler beim Aktualisieren der Regel');
    }
  };

  const handleDeleteRule = async (id: number) => {
    try {
      await fetch(`${basePath}/api/rules/${id}`, {
        method: 'DELETE',
      });
      message.success('Regel erfolgreich gelöscht');
      fetchRules();
    } catch (error) {
      message.error('Fehler beim Löschen der Regel');
    }
  };

  const showModal = (address: number) => {
    setEditingAddress(address);
    setIsModalVisible(true);
    const topic = topics.find(t => t.address === address);
    const addressRules = rules.filter(r => r.address === address);
    form.setFieldsValue({
      address,
      name: topic?.name,
      rules: addressRules,
    });
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      handleNameChange(values.address, values.name);
      values.rules.forEach((rule: RuleData) => {
        if (rule.id) {
          handleEditRule(rule);
        } else {
          handleAddRule({ ...rule, address: values.address });
        }
      });
      setIsModalVisible(false);
    });
  };

  const columns = [
    {
      title: 'Adresse',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Original Topic',
      dataIndex: 'original_topic',
      key: 'original_topic',
    },
    {
      title: 'Aktion',
      key: 'action',
      render: (_: any, record: TopicData) => (
        <Button onClick={() => showModal(record.address)} icon={<EditOutlined />}>
          Bearbeiten
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Alarm-Verwaltung</h1>
      <Table columns={columns} dataSource={topics} rowKey="address" />

      <Modal
        title="Name und Regeln bearbeiten"
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="address" label="Adresse" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Bitte geben Sie einen Namen ein' }]}>
            <Input />
          </Form.Item>
          <Form.List name="rules">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'value']}
                      rules={[{ required: true, message: 'Wert fehlt' }]}
                      style={{ marginRight: 8 }}
                    >
                      <Input placeholder="Wert" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'text']}
                      rules={[{ required: true, message: 'Text fehlt' }]}
                      style={{ marginRight: 8, flex: 1 }}
                    >
                      <Input placeholder="Text" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'id']} hidden>
                      <Input />
                    </Form.Item>
                    <Popconfirm
                      title="Sind Sie sicher, dass Sie diese Regel löschen möchten?"
                      onConfirm={() => {
                        const rule = form.getFieldValue(['rules', name]);
                        if (rule.id) {
                          handleDeleteRule(rule.id);
                        }
                        remove(name);
                      }}
                      okText="Ja"
                      cancelText="Nein"
                    >
                      <Button type="link" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Regel hinzufügen
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}