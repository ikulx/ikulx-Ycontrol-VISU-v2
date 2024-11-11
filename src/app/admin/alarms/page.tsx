'use client'

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Select, Radio, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

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
  priority: 'prio1' | 'prio2' | 'prio3' | 'warnung' | 'info';
  rule_type: 'value' | 'bit';
  bit_rules?: BitRuleData[];
}

interface BitRuleData {
  bit_position: number;
  text_on: string;
  text_off: string;
  priority: 'prio1' | 'prio2' | 'prio3' | 'warnung' | 'info';
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
    try {
      const response = await fetch(`${basePath}/api/topics`);
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Themen');
      }
      const data = await response.json();
      setTopics(data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Themen:', error);
      message.error('Fehler beim Abrufen der Themen');
    }
  };

  const fetchRules = async () => {
    try {
      const response = await fetch(`${basePath}/api/rules`);
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Regeln');
      }
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Regeln:', error);
      message.error('Fehler beim Abrufen der Regeln');
    }
  };

  const handleNameChange = async (address: number, newName: string) => {
    try {
      const response = await fetch(`${basePath}/api/topics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, name: newName }),
      });
      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren des Namens');
      }
      message.success('Name erfolgreich aktualisiert');
      fetchTopics();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Namens:', error);
      message.error('Fehler beim Aktualisieren des Namens');
    }
  };

  const handleAddRule = async (values: RuleData) => {
    try {
      const ruleData = {
        ...values,
        priority: values.priority || 'info',
      };
      const response = await fetch(`${basePath}/api/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });
      if (!response.ok) {
        throw new Error('Fehler beim Hinzufügen der Regel');
      }
      message.success('Regel erfolgreich hinzugefügt');
      fetchRules();
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Regel:', error);
      message.error('Fehler beim Hinzufügen der Regel');
    }
  };

  const handleEditRule = async (values: RuleData) => {
    try {
      const response = await fetch(`${basePath}/api/rules/${values.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Regel');
      }
      message.success('Regel erfolgreich aktualisiert');
      fetchRules();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Regel:', error);
      message.error('Fehler beim Aktualisieren der Regel');
    }
  };

  const handleDeleteRule = async (id: number) => {
    try {
      const response = await fetch(`${basePath}/api/rules/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Fehler beim Löschen der Regel');
      }
      message.success('Regel erfolgreich gelöscht');
      fetchRules();
    } catch (error) {
      console.error('Fehler beim Löschen der Regel:', error);
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
      <Typography.Title level={2}>Alarm-Verwaltung</Typography.Title>
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
                  <div key={key} style={{ marginBottom: 24, border: '1px solid #f0f0f0', padding: 16 }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'rule_type']}
                      label="Regeltyp"
                      rules={[{ required: true, message: 'Bitte wählen Sie den Regeltyp' }]}
                    >
                      <Radio.Group>
                        <Radio value="value">Wert-Regel</Radio>
                        <Radio value="bit">Bit-Regel</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.rules?.[name]?.rule_type !== currentValues.rules?.[name]?.rule_type
                      }
                    >
                      {({ getFieldValue }) =>
                        getFieldValue(['rules', name, 'rule_type']) === 'value' ? (
                          <>
                            <Form.Item
                              {...restField}
                              name={[name, 'value']}
                              label="Wert"
                              rules={[{ required: true, message: 'Wert fehlt' }]}
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'text']}
                              label="Text"
                              rules={[{ required: true, message: 'Text fehlt' }]}
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'priority']}
                              label="Priorität"
                              rules={[{ required: true, message: 'Priorität fehlt' }]}
                            >
                              <Select>
                                <Option value="prio1">PRIO1</Option>
                                <Option value="prio2">PRIO2</Option>
                                <Option value="prio3">PRIO3</Option>
                                <Option value="warnung">WARNUNG</Option>
                                <Option value="info">INFO</Option>
                              </Select>
                            </Form.Item>
                          </>
                        ) : (
                          <Form.List name={[name, 'bit_rules']}>
                            {(bitFields, { add: addBit, remove: removeBit }) => (
                              <>
                                {bitFields.map(({ key: bitKey, name: bitName, ...restBitField }) => (
                                  <div key={bitKey} style={{ marginBottom: 16, border: '1px solid #f0f0f0', padding: 8 }}>
                                    <Form.Item
                                      {...restBitField}
                                      name={[bitName, 'bit_position']}
                                      label="Bit-Position"
                                      rules={[{ required: true, message: 'Bit-Position fehlt' }]}
                                    >
                                      <Select>
                                        {[...Array(16)].map((_, i) => (
                                          <Option key={i} value={i}>{i}</Option>
                                        ))}
                                      </Select>
                                    </Form.Item>
                                    <Form.Item
                                      {...restBitField}
                                      name={[bitName, 'text_on']}
                                      label="Text (Ein)"
                                      rules={[{ required: true, message: 'Text (Ein) fehlt' }]}
                                    >
                                      <Input />
                                    </Form.Item>
                                    <Form.Item
                                      {...restBitField}
                                      name={[bitName, 'text_off']}
                                      label="Text (Aus)"
                                      rules={[{ required: true, message: 'Text (Aus) fehlt' }]}
                                    >
                                      <Input />
                                    </Form.Item>
                                    <Form.Item
                                      {...restBitField}
                                      name={[bitName, 'priority']}
                                      label="Priorität"
                                      rules={[{ required: true, message: 'Priorität fehlt' }]}
                                    >
                                      <Select>
                                        <Option value="prio1">PRIO1</Option>
                                        <Option value="prio2">PRIO2</Option>
                                        <Option value="prio3">PRIO3</Option>
                                        <Option value="warnung">WARNUNG</Option>
                                        <Option value="info">INFO</Option>
                                      </Select>
                                    </Form.Item>
                                    <Button onClick={() => removeBit(bitName)} icon={<DeleteOutlined />}>
                                      Bit-Regel entfernen
                                    </Button>
                                  </div>
                                ))}
                                <Form.Item>
                                  <Button type="dashed" onClick={() => addBit()} block icon={<PlusOutlined />}>
                                    Bit-Regel hinzufügen
                                  </Button>
                                </Form.Item>
                              </>
                            )}
                          </Form.List>
                        )
                      }
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'id']} hidden>
                      <Input />
                    </Form.Item>
                    <Button onClick={() => remove(name)} icon={<DeleteOutlined />}>
                      Regel entfernen
                    </Button>
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