import { Form, Input, Button, Typography } from 'antd';

const { Title } = Typography;

export default function AdminPage() {
  const onFinish = (values: any) => {
    console.log('Success:', values);
  };

  return (
    <div>
      <Title level={2}>Admin Seite</Title>
      <Form
        name="basic"
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="Feld 1 Parameter"
          name="feld1"
          rules={[{ required: true, message: 'Bitte Feld 1 eingeben!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Feld 2 Parameter"
          name="feld2"
          rules={[{ required: true, message: 'Bitte Feld 2 eingeben!' }]}
        >
          <Input />
        </Form.Item>

        {/* Weitere Felder */}
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Speichern
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
