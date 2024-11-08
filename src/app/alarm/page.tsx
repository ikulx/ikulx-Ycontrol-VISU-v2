'use client'

import { useState, useEffect } from 'react'
import { Table, Typography, Button, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

interface Alarm {
  id: number;
  timestamp: string;
  address_name: string;
  address: number;
  rule_text: string;
  value: number;
}

export default function Home() {
  const [activeAlarms, setActiveAlarms] = useState<Alarm[]>([])
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  useEffect(() => {
    const eventSource = new EventSource(`${basePath}/api/alarm/sse`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (Array.isArray(data)) {
          setActiveAlarms(data)
        } else {
          console.error('Received data is not an array:', data)
          message.error('Fehler beim Laden der Alarmdaten')
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
        message.error('Fehler beim Verarbeiten der Alarmdaten')
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      message.error('Verbindungsfehler beim Laden der Alarmdaten')
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const handleClearAlarms = async () => {
    try {
      const response = await fetch(`${basePath}/api/alarm/clear-alarms`, { method: 'POST' })
      if (response.ok) {
        message.success('Alle Alarme wurden quittiert')
        setActiveAlarms([]) // Leere die Liste der aktiven Alarme
      } else {
        message.error('Fehler beim Quittieren der Alarme')
      }
    } catch (error) {
      console.error('Error clearing alarms:', error)
      message.error('Fehler beim Quittieren der Alarme')
    }
  }

  const columns: ColumnsType<Alarm> = [
    {
      title: 'Zeitstempel',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Adresse',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Name der Adresse',
      dataIndex: 'address_name',
      key: 'address_name',
    },
    {
      title: 'Text der Regel',
      dataIndex: 'rule_text',
      key: 'rule_text',
    },
    {
      title: 'Wert',
      dataIndex: 'value',
      key: 'value',
    },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, minHeight: '100vh', backgroundColor: '#141414' }}>
      <Title level={2} style={{ color: '#ffffff', marginBottom: 16 }}>Aktive Alarme</Title>
      <Table 
        columns={columns} 
        dataSource={activeAlarms} 
        rowKey="id"
        pagination={false}
        style={{ marginBottom: 16 }}
      />
      <Button type="primary" onClick={handleClearAlarms}>
        Alarme quittieren
      </Button>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Table, Typography, Button, message, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

interface Alarm {
  id: number;
  timestamp: string;
  address_name: string;
  address: number;
  rule_text: string;
  value: number;
}

export default function Home() {
  const [activeAlarms, setActiveAlarms] = useState<Alarm[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource('/api/alarm/sse')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (Array.isArray(data)) {
          setActiveAlarms(data)
        } else {
          console.error('Received data is not an array:', data)
          message.error('Fehler beim Laden der Alarmdaten')
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
        message.error('Fehler beim Verarbeiten der Alarmdaten')
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      message.error('Verbindungsfehler beim Laden der Alarmdaten')
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const handleClearAlarms = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/clear-alarms', { method: 'POST' })
      if (response.ok) {
        message.success('Alle Alarme wurden quittiert')
        setActiveAlarms([])
        
        // Warte 10 Sekunden, bevor der Ladevorgang beendet wird
        setTimeout(() => {
          setIsLoading(false)
        }, 10000)
      } else {
        message.error('Fehler beim Quittieren der Alarme')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error clearing alarms:', error)
      message.error('Fehler beim Quittieren der Alarme')
      setIsLoading(false)
    }
  }

  const columns: ColumnsType<Alarm> = [
    {
      title: 'Zeitstempel',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Adresse',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Name der Adresse',
      dataIndex: 'address_name',
      key: 'address_name',
    },
    {
      title: 'Text der Regel',
      dataIndex: 'rule_text',
      key: 'rule_text',
    },
    {
      title: 'Wert',
      dataIndex: 'value',
      key: 'value',
    },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, minHeight: '100vh', backgroundColor: '#141414' }}>
      <Title level={2} style={{ color: '#ffffff', marginBottom: 16 }}>Aktive Alarme</Title>
      <Spin spinning={isLoading} tip="Bitte warten...">
        <Table 
          columns={columns} 
          dataSource={activeAlarms} 
          rowKey="id"
          pagination={false}
          style={{ marginBottom: 16 }}
        />
      </Spin>
      <Button type="primary" onClick={handleClearAlarms} disabled={isLoading}>
        Alarme quittieren
      </Button>
    </div>
  )
}