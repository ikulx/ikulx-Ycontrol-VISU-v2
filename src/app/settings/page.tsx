'use client';

import { useState, useEffect } from 'react';
import { Menu, Layout, Table, Input, Dropdown, Button, Typography, Card, Modal, Drawer, Breadcrumb, Tooltip } from 'antd';
import { useSearchParams } from 'next/navigation';
import { MenuOutlined, CloseOutlined, SaveOutlined, DownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { VirtualKeyboard } from './VirtualKeyboard';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';

const { Content, Sider } = Layout;
const { SubMenu } = Menu;

interface DataItem {
  id: number;
  NAME: string;
  NAME_fr?: string;
  NAME_en?: string;
  NAME_it?: string;
  VAR_VALUE: string | number;
  TYPE: 'num' | 'text' | 'bool' | 'drop';
  OPTI?: string;
  OPTI_fr?: string;
  OPTI_en?: string;
  OPTI_it?: string;
  MIN?: number;
  MAX?: number;
  unit: string;
  beschreibung?: string;
  beschreibung_fr?: string;
  beschreibung_en?: string;
  beschreibung_it?: string;
}

interface Tag {
  tag_top: string | null;
  tag_sub: string | null | ''; // tag_sub kann null, leer oder ein String sein
}

// UI-Text Übersetzungen
const uiText = {
  de: {
    menu: "Menü",
    save: "Speichern",
    cancel: "Abbrechen",
    description: "Beschreibung",
    select: "Auswählen",
    parameter: "Parameter",
    value: "Wert",
  },
  fr: {
    menu: "Menu",
    save: "Enregistrer",
    cancel: "Annuler",
    description: "Description",
    select: "Sélectionner",
    parameter: "Paramètre",
    value: "Valeur",
  },
  en: {
    menu: "Menu",
    save: "Save",
    cancel: "Cancel",
    description: "Description",
    select: "Select",
    parameter: "Parameter",
    value: "Value",
  },
  it: {
    menu: "Menu",
    save: "Salva",
    cancel: "Annulla",
    description: "Descrizione",
    select: "Seleziona",
    parameter: "Parametro",
    value: "Valore",
  }
};

export default function SettingsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ top: string; sub?: string } | null>(null);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [data, setData] = useState<DataItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<DataItem | null>(null);
  const [newValue, setNewValue] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] = useState(false);
  const [description, setDescription] = useState<string>('');
  const screens = useBreakpoint();
  const searchParams = useSearchParams();
  const user = searchParams.get('user');
  const initialTop = searchParams.get('top');
  const initialSub = searchParams.get('sub');
  const lang = searchParams.get('lang') || 'de'; // Spracheinstellung aus URL, Standard ist 'de'
  const ui = uiText[lang as keyof typeof uiText];

  useEffect(() => {
    if (!user) {
      console.error('Kein Benutzer angegeben');
      return;
    }

    fetch(`/api/settings/tags?user=${encodeURIComponent(user)}`)
      .then((response) => response.json())
      .then((tags: Tag[]) => {
        const filteredTags = tags.filter((tag) => tag.tag_top !== null);
        setTags(filteredTags);
      })
      .catch((error) => console.error('Fehler beim Abrufen der Tags:', error));
  }, [user]);

  useEffect(() => {
    if (initialTop) {
      setSelectedTags({ top: initialTop, sub: initialSub || undefined });
      setOpenKeys([initialTop]);
    }
  }, [initialTop, initialSub]);

  useEffect(() => {
    if (selectedTags) {
      const encodedTop = encodeURIComponent(selectedTags.top);
      const subPath = selectedTags.sub && selectedTags.sub.trim() !== '' ? `/${encodeURIComponent(selectedTags.sub)}` : '';
      const endpoint = subPath
        ? `/api/settings/data/${encodedTop}${subPath}?user=${encodeURIComponent(user || '')}&lang=${encodeURIComponent(lang)}`
        : `/api/settings/data/${encodedTop}?user=${encodeURIComponent(user || '')}&lang=${encodeURIComponent(lang)}`;

      fetch(endpoint)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Fehler beim Abrufen der Daten');
          }
          return response.json();
        })
        .then((data: DataItem[]) => setData(data))
        .catch((error) => console.error('Fehler beim Abrufen der Daten:', error));
    }
  }, [selectedTags, user, lang]);

  const handleMenuClick = ({ key }: { key: string }) => {
    const [top, sub] = key.split('/');
    setSelectedTags(sub ? { top, sub } : { top });
    setOpenKeys([top]);
    if (!screens.md) {
      setDrawerVisible(false);
    }
  };

  const handleOpenChange = (keys: string[]) => {
    const latestOpenKey = keys.find((key) => !openKeys.includes(key));
    if (latestOpenKey) {
      setOpenKeys([latestOpenKey]);
    } else {
      setOpenKeys([]);
    }
  };

  const handleRowClick = (record: DataItem) => {
    setSelectedRow(record);
    setNewValue(record.VAR_VALUE.toString());
    setIsModalVisible(true);
  };

  const handleSave = () => {
    if (selectedRow) {
      fetch('/api/editor/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedRow.id, VAR_VALUE: newValue }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.error) {
            alert('Fehler beim Speichern: ' + result.error);
          } else {
            setData((prevData) =>
              prevData.map((item) => (item.id === selectedRow.id ? { ...item, VAR_VALUE: newValue } : item))
            );
            setIsModalVisible(false);
          }
        })
        .catch((error) => {
          console.error('Fehler beim Speichern:', error);
          alert('Fehler beim Speichern des Werts.');
        });
    }
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

  const handleDescriptionClick = (beschreibung: string) => {
    setDescription(beschreibung);
    setIsDescriptionModalVisible(true);
  };

  const getLocalizedText = (record: DataItem, key: string) => {
    const localizedKey = `${key}_${lang}` as keyof DataItem;
    return (record[localizedKey] ?? record[key as keyof DataItem]) as string;
  };

  const renderValue = (record: DataItem) => {
    if (record.TYPE === 'drop') {
      const opti = getLocalizedText(record, 'OPTI');
      if (typeof opti === 'string') {
        const selectedOption = opti.split(',').find((opt) => opt.startsWith(String(record.VAR_VALUE)));
        return selectedOption?.split(':')[1] || record.VAR_VALUE;
      }
    }
    return record.VAR_VALUE;
  };

  const renderMenuItems = () => {
    const groupedTags = tags.reduce((acc, tag) => {
      if (tag.tag_top) {
        if (!acc[tag.tag_top]) {
          acc[tag.tag_top] = [];
        }
        if (tag.tag_sub) {
          acc[tag.tag_top].push(tag.tag_sub);
        }
      }
      return acc;
    }, {} as Record<string, string[]>);

    return Object.entries(groupedTags).map(([top, subs]) => {
      if (subs.length > 0) {
        return (
          <SubMenu key={top} title={top}>
            {subs.map((sub) => (
              <Menu.Item key={`${top}/${sub}`}>{sub}</Menu.Item>
            ))}
          </SubMenu>
        );
      } else {
        return <Menu.Item key={top}>{top}</Menu.Item>;
      }
    });
  };

  const handleDropdownSelect = (value: string) => {
    setNewValue(value);
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {screens.md && (
        <Sider width={250} style={{ background: '#1f1f1f', overflowY: 'auto' }}>
          <Menu
            mode="inline"
            theme="dark"
            onClick={handleMenuClick}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            selectedKeys={selectedTags ? [`${selectedTags.top}${selectedTags.sub ? `/${selectedTags.sub}` : ''}`] : []}
          >
            {renderMenuItems()}
          </Menu>
        </Sider>
      )}

      {!screens.md && (
        <>
          <Button
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
            style={{ margin: '16px' }}
          >
            {ui.menu}
          </Button>
          <Drawer
            title={ui.menu}
            placement="left"
            onClose={() => setDrawerVisible(false)}
            visible={drawerVisible}
            bodyStyle={{ padding: 0 }}
          >
            <Menu
              mode="inline"
              theme="dark"
              onClick={handleMenuClick}
              openKeys={openKeys}
              onOpenChange={handleOpenChange}
              selectedKeys={selectedTags ? [`${selectedTags.top}${selectedTags.sub ? `/${selectedTags.sub}` : ''}`] : []}
            >
              {renderMenuItems()}
            </Menu>
          </Drawer>
        </>
      )}

      <Layout>
        <Content style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {selectedTags && (
            <Breadcrumb style={{ padding: '8px 16px' }}>
              <Breadcrumb.Item>
                <Typography.Text style={{ color: 'white' }}>{selectedTags.top}</Typography.Text>
              </Breadcrumb.Item>
              {selectedTags.sub && (
                <Breadcrumb.Item>
                  <Typography.Text style={{ color: 'white' }}>{selectedTags.sub}</Typography.Text>
                </Breadcrumb.Item>
              )}
            </Breadcrumb>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Card
              style={{
                backgroundColor: '#1f1f1f',
                color: 'white',
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                marginBottom: '0',
              }}
              bodyStyle={{ flex: '1', overflow: 'hidden', padding: '0', display: 'flex', flexDirection: 'column' }}
            >
              <Table
                columns={[
                  {
                    title: ui.parameter,
                    dataIndex: 'NAME',
                    key: 'name',
                    ellipsis: true,
                    width: '40%',
                    render: (text: any, record: DataItem) => (
                      <span>
                        {getLocalizedText(record, 'NAME')}
                        {record.beschreibung && (
                          <Tooltip title={ui.description}>
                            <InfoCircleOutlined
                              onClick={() => handleDescriptionClick(getLocalizedText(record, 'beschreibung'))}
                              style={{ marginLeft: 8, cursor: 'pointer' }}
                            />
                          </Tooltip>
                        )}
                      </span>
                    ),
                  },
                  {
                    title: ui.value,
                    dataIndex: 'VAR_VALUE',
                    key: 'var_value',
                    render: (text: any, record: DataItem) => (
                      <div onClick={() => handleRowClick(record)} style={{ cursor: 'pointer', color: '#1890ff' }}>
                        {renderValue(record)} {record.unit}
                      </div>
                    ),
                    ellipsis: true,
                    width: '60%',
                  },
                ]}
                dataSource={data}
                pagination={false}
                scroll={{ x: 'max-content', y: 'calc(100vh - 180px)' }}
                rowKey="id"
                style={{ flex: 1 }}
              />
            </Card>
          </div>
        </Content>
      </Layout>

      {selectedRow && (
        <Modal
          title={getLocalizedText(selectedRow, 'NAME')}
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          centered
        >
          {selectedRow.TYPE === 'drop' && (
            <>
              <Dropdown
                overlay={
                  <Menu onClick={({ key }) => handleDropdownSelect(key)}>
                    {getLocalizedText(selectedRow, 'OPTI')?.split(',').map((opt) => {
                      const [val, label] = opt.split(':');
                      return <Menu.Item key={val}>{label}</Menu.Item>;
                    })}
                  </Menu>
                }
              >
                <Button style={{ width: '100%' }}>
                  {getLocalizedText(selectedRow, 'OPTI')?.split(',').find((opt) => opt.startsWith(newValue))?.split(':')[1] || ui.select}{' '}
                  <DownOutlined />
                </Button>
              </Dropdown>
            </>
          )}
          {selectedRow.TYPE === 'num' && (
            <>
              <Typography.Title level={4}>{getLocalizedText(selectedRow, 'NAME')}</Typography.Title>
              <p>Min: {selectedRow.MIN}, Max: {selectedRow.MAX}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  style={{ width: 'calc(100% - 60px)' }}
                />
                <span style={{ color: 'white', fontSize: '16px' }}>{selectedRow.unit}</span>
              </div>
              <VirtualKeyboard onInput={handleKeyboardInput} onDelete={handleDeleteInput} />
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button
              icon={<CloseOutlined />}
              onClick={() => setIsModalVisible(false)}
              style={{ marginRight: '10px' }}
            >
              {ui.cancel}
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
            >
              {ui.save}
            </Button>
          </div>
        </Modal>
      )}

      {isDescriptionModalVisible && (
        <Modal
          title={ui.description}
          visible={isDescriptionModalVisible}
          onCancel={() => setIsDescriptionModalVisible(false)}
          footer={null}
          centered
        >
          <Typography.Paragraph>{description}</Typography.Paragraph>
        </Modal>
      )}
    </Layout>
  );
}
