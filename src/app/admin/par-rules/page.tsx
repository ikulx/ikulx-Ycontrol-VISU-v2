"use client"; // Markiert diese Datei als Client-Komponente

import { Select, Form, Input, Button, Radio, Table, Popconfirm, message, Modal } from 'antd';
import React, { useState, useEffect } from 'react';

interface Parameter {
  NAME: string;
}

interface Editor {
  EDITOR: string;
}

interface Rule {
  id: number;
  trigger_parameter: string;
  condition_value: string;
  operator: string;
  rule_type: string;
  affected_value: string;
  action: string;
}

const { Option } = Select;

const RulePage = () => {
  const [form] = Form.useForm();
  const [ruleType, setRuleType] = useState('PARAMETER');
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // Steuert die Sichtbarkeit des Modals

  // Daten laden
  const fetchData = async () => {
    setLoading(true);
    const paramRes = await fetch('/api/parameters');
    const editorRes = await fetch('/api/editors');
    const rulesRes = await fetch('/api/rules');

    const paramData: Parameter[] = await paramRes.json();
    const editorData: Editor[] = await editorRes.json();
    const rulesData: Rule[] = await rulesRes.json();

    setParameters(paramData);
    setEditors(editorData);
    setRules(rulesData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Regel hinzufügen oder bearbeiten
  const handleSubmit = async (values: any) => {
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/rules/${editId}` : '/api/rules';
    
    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        message.success(editId ? 'Regel erfolgreich aktualisiert' : 'Regel erfolgreich hinzugefügt');
        fetchData();  // Tabelle aktualisieren
        form.resetFields();
        setEditId(null);  // Reset der Edit-ID
        setIsModalVisible(false); // Schließe das Modal
      } else {
        message.error('Fehler beim Speichern der Regel');
      }
    } catch (error) {
      message.error('Verbindung zur API fehlgeschlagen');
    }
  };

  // Regel bearbeiten: Werte ins Formular laden und Modal öffnen
  const handleEdit = (rule: Rule) => {
    form.setFieldsValue({
      trigger_parameter: rule.trigger_parameter,
      condition_value: rule.condition_value,
      operator: rule.operator,
      rule_type: rule.rule_type,
      affected_value: rule.affected_value,
      action: rule.action,
    });
    setEditId(rule.id); // Setze die ID für das Update
    setIsModalVisible(true); // Öffne das Modal
  };

  // Regel löschen
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/rules/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        message.success('Regel erfolgreich gelöscht');
        fetchData();  // Daten nach dem Löschen aktualisieren
      } else {
        message.error('Fehler beim Löschen der Regel');
      }
    } catch (error) {
      message.error('Verbindung zur API fehlgeschlagen');
    }
  };

  // Öffne Modal zum Hinzufügen einer neuen Regel
  const showModal = () => {
    form.resetFields();
    setEditId(null); // Setze Edit-ID zurück
    setIsModalVisible(true); // Öffne Modal
  };

  // Schließe Modal
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Auslöse-Parameter',
      dataIndex: 'trigger_parameter',
      key: 'trigger_parameter',
    },
    {
      title: 'Operator',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: 'Bedingung Wert',
      dataIndex: 'condition_value',
      key: 'condition_value',
    },
    {
      title: 'Regel Typ',
      dataIndex: 'rule_type',
      key: 'rule_type',
    },
    {
      title: 'Ziel (Parameter/Editor)',
      dataIndex: 'affected_value',
      key: 'affected_value',
    },
    {
      title: 'Aktion',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Aktionen',
      key: 'actions',
      render: (_: any, record: Rule) => (
        <div>
          <Button onClick={() => handleEdit(record)}>Bearbeiten</Button>
          <Popconfirm
            title="Sicher, dass du diese Regel löschen möchtest?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ja"
            cancelText="Nein"
          >
            <Button danger>Löschen</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1>Regeln verwalten</h1>

      <Button type="primary" onClick={showModal}>Regel hinzufügen</Button> {/* Button zum Anzeigen des Modals */}

      {/* Modal zum Hinzufügen und Bearbeiten von Regeln */}
      <Modal
        title={editId ? 'Regel bearbeiten' : 'Regel hinzufügen'}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Auslöse-Parameter" name="trigger_parameter" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Parameter auswählen"
              optionFilterProp="children"
            >
              {parameters.map(param => (
                <Option key={param.NAME} value={param.NAME}>
                  {param.NAME}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Operator" name="operator" rules={[{ required: true }]}>
            <Select placeholder="Operator auswählen">
              <Option value="=">=</Option>
              <Option value=">">&gt;</Option>
              <Option value="<">&lt;</Option>
              <Option value=">=">&gt;=</Option>
              <Option value="<=">&lt;=</Option>
              <Option value="!=">!=</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Bedingung Wert" name="condition_value" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Regel Typ" name="rule_type" rules={[{ required: true }]}>
            <Radio.Group
              onChange={(e) => setRuleType(e.target.value)}
              value={ruleType}
            >
              <Radio value="PARAMETER">Einzelner Parameter</Radio>
              <Radio value="EDITOR">Editor (alle Parameter)</Radio>
            </Radio.Group>
          </Form.Item>

          {ruleType === 'PARAMETER' ? (
            <Form.Item label="Zielparameter" name="affected_value" rules={[{ required: true }]}>
              <Select
                showSearch
                placeholder="Zielparameter auswählen"
                optionFilterProp="children"
              >
                {parameters.map(param => (
                  <Option key={param.NAME} value={param.NAME}>
                    {param.NAME}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <Form.Item label="Editor Wert" name="affected_value" rules={[{ required: true }]}>
              <Select
                showSearch
                placeholder="Editor auswählen"
                optionFilterProp="children"
              >
                {editors.map(editor => (
                  <Option key={editor.EDITOR} value={editor.EDITOR}>
                    {editor.EDITOR}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item label="Aktion" name="action" rules={[{ required: true }]}>
            <Select placeholder="Aktion auswählen">
              <Option value="SHOW">Einblenden</Option>
              <Option value="HIDE">Ausblenden</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editId ? 'Regel aktualisieren' : 'Regel hinzufügen'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Tabelle der bestehenden Regeln */}
      <Table
        dataSource={rules}
        columns={columns}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
};

export default RulePage;
