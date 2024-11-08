'use client'

import { useState, useEffect } from 'react'
import { Button, List, Typography, Modal } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { AddressModal } from '@/components/AddressModal'

const { Title } = Typography

interface Address {
  id: number
  address: number
  name: string
  rules: { id: number; condition: string; message: string }[]
}

export default function AdminPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    const response = await fetch(`${basePath}/api/alarm/addresses`)
    const data = await response.json()
    setAddresses(data)
  }

  const handleOpenModal = (address: Address) => {
    setSelectedAddress(address)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setSelectedAddress(null)
    setIsModalOpen(false)
  }

  const handleSaveAddress = async (address: number, name: string, rules: { id: number; condition: string; message: string }[]) => {
    await fetch(`${basePath}/api/alarm/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, name, rules }),
    })
    fetchAddresses()
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Title level={2}>Adressverwaltung</Title>
      <List
        dataSource={addresses}
        renderItem={(address) => (
          <List.Item
            actions={[
              <Button 
                key="edit" 
                icon={<EditOutlined />} 
                onClick={() => handleOpenModal(address)}
              >
                Bearbeiten
              </Button>
            ]}
          >
            <List.Item.Meta
              title={`Adresse: ${address.address}`}
              description={`Name: ${address.name || 'Nicht zugewiesen'}`}
            />
          </List.Item>
        )}
      />
      {selectedAddress && (
        <AddressModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          address={selectedAddress}
          onSave={handleSaveAddress}
        />
      )}
    </div>
  )
}