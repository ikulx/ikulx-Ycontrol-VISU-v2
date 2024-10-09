import { Input, Typography, Row, Col } from 'antd';

const { Title } = Typography;

export default function HKLPage() {
  return (
    <div>
      <Title level={2}>HKL Seite</Title>
      <svg width="818" height="418" viewBox="0 0 818 418">
        <rect width="818" height="418" fill="black" />
        <rect x="276" y="290" width="46" height="7" fill="#2196F3" />
        {/* Other SVG paths here */}
      </svg>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Input placeholder="Feld 1" />
        </Col>
        <Col span={8}>
          <Input placeholder="Feld 2" />
        </Col>
        <Col span={8}>
          <Input placeholder="Feld 3" />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Input placeholder="Feld 4" />
        </Col>
        <Col span={8}>
          <Input placeholder="Feld 5" />
        </Col>
        <Col span={8}>
          <Input placeholder="Feld 6" />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Typography.Text>Dis1: Anzeige 1</Typography.Text>
        </Col>
        <Col span={8}>
          <Typography.Text>Dis2: Anzeige 2</Typography.Text>
        </Col>
      </Row>
    </div>
  );
}
