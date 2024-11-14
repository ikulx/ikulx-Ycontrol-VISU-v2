// Pfad: src\app\editor\[editor]\VirtualKeyboard.tsx

import React from 'react';
import { Button, Row, Col } from 'antd';

interface VirtualKeyboardProps {
  onInput: (value: string) => void;
  onDelete: () => void;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onInput, onDelete }) => {
  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '.'];

  return (
    <div style={{ marginTop: '20px' }}>
      <Row gutter={[16, 16]}>
        {buttons.map((button) => (
          <Col span={8} key={button}>
            <Button
              style={{ width: '100%', height: '50px' }}
              onClick={() => onInput(button)}
            >
              {button}
            </Button>
          </Col>
        ))}
        <Col span={8}>
          <Button
            style={{ width: '100%', height: '50px' }}
            onClick={onDelete}
          >
            Löschen
          </Button>
        </Col>
      </Row>
    </div>
  );
};
