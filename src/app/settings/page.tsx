// app/settings/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Menu,
  Layout,
  Table,
  Input,
  Dropdown,
  Button,
  Typography,
  Card,
  Modal,
  Drawer,
  Breadcrumb,
  Tooltip,
  Spin,
  Alert,
} from 'antd';
import { useSearchParams } from 'next/navigation';
import {
  MenuOutlined,
  CloseOutlined,
  SaveOutlined,
  DownOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { VirtualKeyboard } from './VirtualKeyboard';
import { SwissKeyboard } from './SwissKeyboard';
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
  unit?: string | null; // unit kann jetzt auch null sein
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
    menu: 'Menü',
    save: 'Speichern',
    cancel: 'Abbrechen',
    description: 'Beschreibung',
    select: 'Auswählen',
    parameter: 'Parameter',
    value: 'Wert',
    loading: 'Lädt...',
    errorFetchingTags: 'Es konnten keine Parameter abgerufen werden.',
    errorFetchingData: 'Es konnten keine Daten abgerufen werden.',
  },
  fr: {
    menu: 'Menu',
    save: 'Enregistrer',
    cancel: 'Annuler',
    description: 'Description',
    select: 'Sélectionner',
    parameter: 'Paramètre',
    value: 'Valeur',
    loading: 'Chargement...',
    errorFetchingTags: 'Impossible de récupérer les paramètres.',
    errorFetchingData: 'Impossible de récupérer les données.',
  },
  en: {
    menu: 'Menu',
    save: 'Save',
    cancel: 'Cancel',
    description: 'Description',
    select: 'Select',
    parameter: 'Parameter',
    value: 'Value',
    loading: 'Loading...',
    errorFetchingTags: 'Unable to fetch parameters.',
    errorFetchingData: 'Unable to fetch data.',
  },
  it: {
    menu: 'Menu',
    save: 'Salva',
    cancel: 'Annulla',
    description: 'Descrizione',
    select: 'Seleziona',
    parameter: 'Parametro',
    value: 'Valore',
    loading: 'Caricamento...',
    errorFetchingTags: 'Impossibile recuperare i parametri.',
    errorFetchingData: 'Impossibile recuperare i dati.',
  },
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
  const [loadingTags, setLoadingTags] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [errorTags, setErrorTags] = useState<string | null>(null);
  const [errorData, setErrorData] = useState<string | null>(null);
  const screens = useBreakpoint();
  const searchParams = useSearchParams();
  const user = searchParams.get('user');
  const initialTop = searchParams.get('top');
  const initialSub = searchParams.get('sub');
  const lang = searchParams.get('lang') || 'de'; // Spracheinstellung aus URL, Standard ist 'de'
  const ui = uiText[lang as keyof typeof uiText];

  // Effekt zum Abrufen der Tags
  useEffect(() => {
    const fetchTags = async () => {
      let endpoint = '/api/settings/tags';
      const params = new URLSearchParams();

      if (user) {
        params.append('user', user);
      } else {
        params.append('noUser', 'true');
      }

      endpoint = `${endpoint}?${params.toString()}`;
      setLoadingTags(true);
      setErrorTags(null);

      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Fehler beim Abrufen der Tags');
        }
        const tags: Tag[] = await response.json();
        const filteredTags = tags.filter((tag) => tag.tag_top !== null);
        setTags(filteredTags);
      } catch (error) {
        console.error('Fehler beim Abrufen der Tags:', error);
        setErrorTags(ui.errorFetchingTags);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTags();
  }, [user, ui.errorFetchingTags]);

  // Effekt zum Setzen der initial ausgewählten Tags
  useEffect(() => {
    if (initialTop) {
      setSelectedTags({ top: initialTop, sub: initialSub || undefined });
      setOpenKeys([initialTop]);
    }
  }, [initialTop, initialSub]);

  // Effekt zum Abrufen der Daten basierend auf den ausgewählten Tags
  useEffect(() => {
    const fetchData = async () => {
      if (selectedTags) {
        const encodedTop = encodeURIComponent(selectedTags.top);
        const subPath =
          selectedTags.sub && selectedTags.sub.trim() !== ''
            ? `/${encodeURIComponent(selectedTags.sub)}`
            : '';
        let endpoint = `/api/settings/data/${encodedTop}${subPath}`;
        const params = new URLSearchParams();

        if (user) {
          params.append('user', user);
        } else {
          params.append('noUser', 'true');
        }
        params.append('lang', lang);

        endpoint = `${endpoint}?${params.toString()}`;
        setLoadingData(true);
        setErrorData(null);

        try {
          const response = await fetch(endpoint);
          if (!response.ok) {
            throw new Error('Fehler beim Abrufen der Daten');
          }
          const data: DataItem[] = await response.json();
          setData(data);
        } catch (error) {
          console.error('Fehler beim Abrufen der Daten:', error);
          setErrorData(ui.errorFetchingData);
        } finally {
          setLoadingData(false);
        }
      }
    };

    fetchData();
  }, [selectedTags, user, lang, ui.errorFetchingData]);

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

  const handleSave = async () => {
    if (selectedRow) {
      try {
        const response = await fetch('/api/editor/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedRow.id, VAR_VALUE: newValue }),
        });
        const result = await response.json();

        if (result.error) {
          alert('Fehler beim Speichern: ' + result.error);
        } else {
          setData((prevData) =>
            prevData.map((item) =>
              item.id === selectedRow.id ? { ...item, VAR_VALUE: newValue } : item
            )
          );
          setIsModalVisible(false);
        }
      } catch (error) {
        console.error('Fehler beim Speichern:', error);
        alert('Fehler beim Speichern des Werts.');
      }
    }
  };

  const handleKeyboardInput = (input: string) => {
    if (selectedRow?.TYPE === 'num') {
      // Für num-Typ: Erlaubte Eingaben sind Zahlen, Punkt und Minus
      if (input === '.' && newValue.includes('.')) return;
      if (input === '-' && newValue.includes('-')) return;
      if (input === '-' && newValue !== '0') return;
      setNewValue((prevValue) =>
        prevValue === '0' && input !== '.' && input !== '-' ? input : prevValue + input
      );
    } else if (selectedRow?.TYPE === 'text') {
      // Für text-Typ: Erlaubte Eingaben sind Buchstaben und spezielle Zeichen
      setNewValue((prevValue) => prevValue + input);
    }
  };

  const handleDeleteInput = () => {
    setNewValue((prevValue) => (prevValue.length > 1 ? prevValue.slice(0, -1) : ''));
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
    const groupedTags = tags.reduce((acc: Record<string, string[]>, tag) => {
      if (tag.tag_top) {
        if (!acc[tag.tag_top]) {
          acc[tag.tag_top] = [];
        }
        if (tag.tag_sub) {
          acc[tag.tag_top].push(tag.tag_sub);
        }
      }
      return acc;
    }, {});

    return Object.entries(groupedTags).map(([top, subs]) => {
      if (subs.length > 0) {
        return (
          <SubMenu key={top} title={top}>
            {subs.map((sub) => (
              <Menu.Item key={`${top}/${sub}`}>
                {sub}
              </Menu.Item>
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

  // Dynamische Modal-Breite basierend auf Bildschirmgröße
  const getModalWidth = () => {
    if (screens.xxl) return '60%';
    if (screens.xl) return '60%';
    if (screens.lg) return '70%';
    if (screens.md) return '80%';
    if (screens.sm) return '90%';
    return '95%';
  };

  // Styles für das Modal anpassen, um genügend Platz für die Tastatur zu schaffen und Dark Mode
  const modalStyle: React.CSSProperties = {
    maxHeight: '80vh', // Erhöhte maximale Höhe
    overflowY: 'auto', // Scrollen ermöglichen
    backgroundColor: '#1f1f1f', // Dunkler Hintergrund für das Modal
    color: 'white', // Helle Schriftfarbe
    padding: '20px',
  };

  // Styles für Input-Felder im Modal
  const inputStyle: React.CSSProperties = {
    width: '100%', // Volle Breite, angepasst für flexibles Layout
    backgroundColor: '#434343',
    color: 'white',
    border: '1px solid #555555',
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden', backgroundColor: '#1f1f1f' }}>
      {screens.md && (
        <Sider width={250} style={{ background: '#1f1f1f', overflowY: 'auto',  height: '97vh', }}>
          <Menu
            mode="inline"
            theme="dark"
            onClick={handleMenuClick}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            selectedKeys={
              selectedTags
                ? [`${selectedTags.top}${selectedTags.sub ? `/${selectedTags.sub}` : ''}`]
                : []
            }
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
            open={drawerVisible}
            bodyStyle={{ padding: 0, backgroundColor: '#1f1f1f', color: 'white' }}
          >
            <Menu
              mode="inline"
              theme="dark"
              onClick={handleMenuClick}
              openKeys={openKeys}
              onOpenChange={handleOpenChange}
              selectedKeys={
                selectedTags
                  ? [`${selectedTags.top}${selectedTags.sub ? `/${selectedTags.sub}` : ''}`]
                  : []
              }
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
              bodyStyle={{
                flex: '1',
                overflow: 'hidden',
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {loadingData ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flex: 1,
                  }}
                >
                  <Spin tip={ui.loading} />
                </div>
              ) : errorData ? (
                <Alert message={errorData} type="error" showIcon style={{ margin: '16px' }} />
              ) : (
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
                                onClick={() =>
                                  handleDescriptionClick(getLocalizedText(record, 'beschreibung'))
                                }
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
                        <div
                          onClick={() => handleRowClick(record)}
                          style={{ cursor: 'pointer', color: '#1890ff' }}
                        >
                          {renderValue(record)}
                          {record.TYPE === 'num' && record.unit ? ` ${record.unit}` : ''}
                        </div>
                      ),
                      ellipsis: true,
                      width: '60%',
                    },
                  ]}
                  dataSource={data}
                  pagination={false}
                  scroll={{ x: 'max-content', y: 'calc(100vh - 120px)' }}
                  rowKey="id"
                  style={{ flex: 1 }}
                />
              )}
            </Card>
          </div>

          {/* Anzeigen von Lade- und Fehlerzuständen für Tags */}
          {loadingTags && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Spin tip={ui.loading} />
            </div>
          )}
          {errorTags && <Alert message={errorTags} type="error" showIcon style={{ margin: '16px' }} />}
        </Content>
      </Layout>

      {/* Modal zum Bearbeiten von Parametern */}
      {selectedRow && (
        <Modal
          title={getLocalizedText(selectedRow, 'NAME')}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          centered
          width={getModalWidth()} // Dynamische Breite basierend auf Bildschirmgröße
          bodyStyle={modalStyle} // Maximale Höhe und Scrollen ermöglichen
        >
          {selectedRow.TYPE === 'drop' && (
            <>
              <Dropdown trigger={['click']}
                overlay={
                  <Menu onClick={({ key }) => handleDropdownSelect(key)}>
                    {getLocalizedText(selectedRow, 'OPTI')?.split(',').map((opt) => {
                      const [val, label] = opt.split(':');
                      return (
                        <Menu.Item key={val}>
                          {label}
                        </Menu.Item>
                      );
                    })}
                  </Menu>
                }
              >
                <Button
                  style={{
                    width: '100%',
                    marginBottom: '16px',
                    backgroundColor: '#434343',
                    color: 'white',
                    border: '1px solid #555555',
                  }}
                >
                  {getLocalizedText(selectedRow, 'OPTI')?.split(',').find((opt) => opt.startsWith(String(newValue)))?.split(':')[1] ||
                    ui.select}{' '}
                  <DownOutlined />
                </Button>
              </Dropdown>
            </>
          )}
          {selectedRow.TYPE === 'num' && (
            <>
              <Typography.Title level={4}>{getLocalizedText(selectedRow, 'NAME')}</Typography.Title>
              <p style={{ marginBottom: '16px' }}>
                Min: {selectedRow.MIN}, Max: {selectedRow.MAX}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  style={inputStyle}
                />
                <span style={{ color: 'white', fontSize: '16px' }}>
                  {selectedRow.unit || ''}
                </span>
              </div>
              <VirtualKeyboard onInput={handleKeyboardInput} onDelete={handleDeleteInput} />
            </>
          )}
          {selectedRow.TYPE === 'text' && (
            <>
              <Typography.Title level={4}>{getLocalizedText(selectedRow, 'NAME')}</Typography.Title>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                style={{ ...inputStyle, marginBottom: '16px' }}
              />
              <SwissKeyboard onInput={handleKeyboardInput} onDelete={handleDeleteInput} />
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
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              {ui.save}
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal für Beschreibungen */}
      {isDescriptionModalVisible && (
        <Modal
          title={ui.description}
          open={isDescriptionModalVisible}
          onCancel={() => setIsDescriptionModalVisible(false)}
          footer={null}
          centered
          style={{ backgroundColor: '#1f1f1f', color: 'white' }} // Dunkler Hintergrund für das Modal
          bodyStyle={{ color: 'white', padding: '20px' }}
        >
          <Typography.Paragraph>{description}</Typography.Paragraph>
        </Modal>
      )}
    </Layout>
  );
}
