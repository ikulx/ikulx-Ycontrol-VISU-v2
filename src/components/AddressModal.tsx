import React, { useEffect } from 'react'
import { Modal, Form, Input, Button, Space, InputNumber } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

interface Rule {
  id: number
  value: number
  message: string
}

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  address: { id: number; address: number; name: string; rules: Rule[] }
  onSave: (address: number, name: string, rules: Rule[]) => void
}

export function AddressModal({ isOpen, onClose, address, onSave }: AddressModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    form.setFieldsValue({
      name: address.name,
      rules: address.rules,
    })
  }, [address, form])

  const handleSave = () => {
    form.validateFields().then((values) => {
      onSave(address.address, values.name, values.rules)
      onClose()
    })
  }

  return (
    <Modal
      title={`Adresse bearbeiten: ${address.address}`}
      open={isOpen}
      onCancel={onClose}
      onOk={handleSave}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Bitte geben Sie einen Namen ein' }]}>
          <Input />
        </Form.Item>
        <Form.List name="rules">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'value']}
                    rules={[{ required: true, message: 'Wert fehlt' }]}
                  >
                    <InputNumber placeholder="Wert" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'message']}
                    rules={[{ required: true, message: 'Nachricht fehlt' }]}
                  >
                    <Input placeholder="Alarmnachricht" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
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
  )
}