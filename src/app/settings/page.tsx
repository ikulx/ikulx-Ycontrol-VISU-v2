'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ConfigProvider, Menu, Layout, Table, Input, Dropdown, Button, Typography, Card, Modal, Drawer, Breadcrumb, Tooltip, Spin, Alert, theme
} from 'antd';
import { useSearchParams } from 'next/navigation';
import { MenuOutlined, CloseOutlined, SaveOutlined, DownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { VirtualKeyboard } from './VirtualKeyboard';
import { SwissKeyboard } from './SwissKeyboard';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import { unit } from '@ant-design/cssinjs';

// Base Path aus Umgebungsvariable
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const { Content, Sider } = Layout;
const { SubMenu } = Menu;

interface DataItem {
  id: number;
  NAME: string;
  VAR_VALUE: string | number;
  TYPE: 'num' | 'text' | 'bool' | 'drop';
  OPTI?: string;
  MIN?: number;
  MAX?: number;
  unit?: string | null;
  beschreibung?: string;
}

interface Tag {
  tag_top: string | null;
  tag_sub: string | null | '';
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
    errorNoUser: 'Kein Benutzer angegeben.',
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
    errorNoUser: 'Kein Benutzer angegeben.',
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
    errorNoUser: 'Kein Benutzer angegeben.',
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
    errorNoUser: 'Kein Benutzer angegeben.',
  },

};

export default function SettingsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ top: string; sub?: string } | null>(null);
  const [data, setData] = useState<DataItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<DataItem | null>(null);
  const [newValue, setNewValue] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [description, setDescription] = useState<string>('');
  const [loadingTags, setLoadingTags] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [errorTags, setErrorTags] = useState<string | null>(null);
  const [errorData, setErrorData] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null); // Fehler für fehlenden Benutzer

  const screens = useBreakpoint();
  const searchParams = useSearchParams();
  const user = searchParams.get('user');
  const initialTop = searchParams.get('top');
  const initialSub = searchParams.get('sub');
  const lang = searchParams.get('lang') || 'de';
  const ui = uiText[lang as keyof typeof uiText];

  const { darkAlgorithm } = theme;

  // Prüfen, ob Benutzer vorhanden ist
  useEffect(() => {
    if (!user) {
      setUserError(ui.errorNoUser);
    }
  }, [user, ui]);

  // Tags abrufen (nur wenn Benutzer vorhanden)
  const fetchTags = async () => {
    if (!user) return; // Verhindere API-Aufrufe, wenn kein Benutzer vorhanden ist

    try {
      const params = new URLSearchParams(user ? { user } : { noUser: 'true' });
      const response = await fetch(`${basePath}/api/settings/tags?${params.toString()}`);
      if (!response.ok) throw new Error('Fehler beim Abrufen der Tags');
      const tags = await response.json();
      setTags(tags.filter((tag: Tag) => tag.tag_top !== null));
      setLoadingTags(false);
    } catch (error) {
      setErrorTags(ui.errorFetchingTags);
      setLoadingTags(false);
    }
  };

  useEffect(() => {
    if (!userError) {
      setLoadingTags(true);
      fetchTags();
    }
  }, [userError, user, ui]);

  useEffect(() => {
    if (initialTop && !userError) {
      setSelectedTags({ top: initialTop, sub: initialSub || undefined });
    }
  }, [initialTop, initialSub, userError]);

  // SSE zur Datenaktualisierung (nur wenn Benutzer vorhanden)
  useEffect(() => {
    if (!userError) {
      const eventSource = new EventSource(`${basePath}/api/sse`);
      eventSource.onmessage = (event) => {
        const newData = JSON.parse(event.data);
        if (Array.isArray(newData)) {
          setData((prevData) =>
            prevData.map((item) => {
              const updatedItem = newData.find((d: { id: number }) => d.id === item.id);
              return updatedItem ? { ...item, VAR_VALUE: updatedItem.VAR_VALUE } : item;
            })
          );
        }
      };

      eventSource.onerror = () => eventSource.close();
      return () => eventSource.close();
    }
  }, [userError]);

  const fetchData = useCallback(async () => {
    if (!selectedTags || userError) return;

    try {
      const endpoint = `${basePath}/api/settings/data/${encodeURIComponent(selectedTags.top)}${
        selectedTags.sub ? `/${encodeURIComponent(selectedTags.sub)}` : ''
      }`;
      const params = new URLSearchParams(user ? { user, lang } : { noUser: 'true', lang });
      setLoadingData(true);
      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) throw new Error('Fehler beim Abrufen der Daten');
      const data = await response.json();
      setData(data);
      setLoadingData(false);
    } catch (error) {
      setErrorData(ui.errorFetchingData);
      setLoadingData(false);
    }
  }, [selectedTags, user, lang, userError, ui.errorFetchingData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (selectedRow) {
      try {
        const response = await fetch(`${basePath}/api/editor/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedRow.id, VAR_VALUE: newValue }),
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        setData((prevData) =>
          prevData.map((item) =>
            item.id === selectedRow.id ? { ...item, VAR_VALUE: newValue } : item
          )
        );
        setModalVisible(false);
      } catch (error: any) {
        alert(`Fehler beim Speichern des Werts: ${error.message}`);
      }
    }
  };

  const renderValue = (record: DataItem) => {
    if (record.TYPE === 'drop') {
      const opti = getLocalizedText(record, 'OPTI');
      if (typeof opti === 'string') {
        // Suche nach der Bezeichnung, die zu VAR_VALUE passt
        const selectedOption = opti.split(',').find((opt) => opt.startsWith(String(record.VAR_VALUE)));
        return selectedOption ? selectedOption.split(':')[1] : record.VAR_VALUE; // Zeige die Bezeichnung, nicht den Wert
      }
    }
    return record.VAR_VALUE;
  };

  const getLocalizedText = (record: DataItem, key: string): string => {
    const value = record[`${key}_${lang}` as keyof DataItem] ?? record[key as keyof DataItem];
    return value !== undefined && value !== null ? String(value) : ''; // Fallback auf einen leeren String
  };

  const renderMenuItems = () => {
    const groupedTags = tags.reduce((acc: Record<string, string[]>, tag) => {
      if (tag.tag_top) {
        if (!acc[tag.tag_top]) acc[tag.tag_top] = [];
        if (tag.tag_sub) acc[tag.tag_top].push(tag.tag_sub);
      }
      return acc;
    }, {});

    // Sortiere die `top`-Level-Menüs alphabetisch
    const sortedTopLevelTags = Object.entries(groupedTags).sort(([a], [b]) => a.localeCompare(b));

    return sortedTopLevelTags.map(([top, subs]) => (
      subs.length > 0 ? (
        <SubMenu key={top} title={top}>
          {/* Sortiere die `sub`-Menüs alphabetisch */}
          {subs.sort((a, b) => a.localeCompare(b)).map((sub) => (
            <Menu.Item key={`${top}/${sub}`} onClick={() => setSelectedTags({ top, sub })}>
              {sub}
            </Menu.Item>
          ))}
        </SubMenu>
      ) : (
        <Menu.Item key={top} onClick={() => setSelectedTags({ top })}>
          {top}
        </Menu.Item>
      )
    ));
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {screens.md && (
        <Sider width={200} style={{ overflowY: 'auto', height: '100vh' }}>
          <Menu
            mode="inline"
            selectedKeys={selectedTags ? [`${selectedTags.top}${selectedTags.sub ? `/${selectedTags.sub}` : ''}`] : []}
          >
            {loadingTags ? <Spin tip={ui.loading} /> : renderMenuItems()}
          </Menu>
        </Sider>
      )}

      {!screens.md && (
        <>
          <Button icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)} style={{ margin: '16px' }}>
            {ui.menu}
          </Button>
          <Drawer title={ui.menu} placement="left" onClose={() => setDrawerVisible(false)} open={drawerVisible}>
            <Menu mode="inline">
              {loadingTags ? <Spin tip={ui.loading} /> : renderMenuItems()}
            </Menu>
          </Drawer>
        </>
      )}

      <Layout>
        <Content style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {userError && <Alert message={userError} type="error" showIcon style={{ margin: '16px' }} />}

          {selectedTags && (
            <Breadcrumb style={{ padding: '8px 16px' }}>
              <Breadcrumb.Item>{selectedTags.top}</Breadcrumb.Item>
              {selectedTags.sub && <Breadcrumb.Item>{selectedTags.sub}</Breadcrumb.Item>}
            </Breadcrumb>
          )}

          <Card style={{ flex: 1, overflow: 'hidden' }}>
            {loadingData ? <Spin tip={ui.loading} /> : (
              <Table
                columns={[
                  {
                    title: ui.parameter,
                    dataIndex: 'NAME',
                    render: (text, record) => (
                      <span>
                        {getLocalizedText(record, 'NAME')}
                        {record.beschreibung && (
                          <InfoCircleOutlined
                            style={{ marginLeft: '8px' }}
                            onClick={() => {
                              setDescription(getLocalizedText(record, 'beschreibung'));
                              setDescriptionModalVisible(true);
                            }}
                          />
                        )}
                      </span>
                    ),
                    width: '40%',
                  },
                  {
                    title: ui.value,
                    dataIndex: 'VAR_VALUE',
                    render: (text, record) => (
                      <div
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedRow(record);
                          setNewValue(record.VAR_VALUE.toString());
                          setModalVisible(true);
                        }}
                      >
                        <Button>
                          {renderValue(record)}
                          {record.TYPE === 'num' && record.unit && ` ${record.unit}`}
                        </Button>
                      </div>
                    ),
                    width: '60%',
                  },
                ]}
                dataSource={data}
                pagination={false}
                scroll={{ y: 'calc(100vh - 120px)' }}
                rowKey="id"
              />
            )}
          </Card>
        </Content>
      </Layout>

      {/* Modal zum Bearbeiten */}
      {selectedRow && (
        <Modal
          title={getLocalizedText(selectedRow, 'NAME')}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSave}></Button>,
            <Button size="large" icon={<CloseOutlined />} onClick={() => setModalVisible(false)}></Button>,
          ]}
          centered
          width="60%"
        >
          {selectedRow.TYPE === 'drop' && (
            <p>
              <Dropdown
                trigger={['click']}
                overlay={
                  <Menu onClick={({ key }) => setNewValue(key)}>
                    {getLocalizedText(selectedRow, 'OPTI')?.split(',').map((opt) => {
                      const [val, label] = opt.split(':');
                      return <Menu.Item key={val}>{label}</Menu.Item>;
                    })}
                  </Menu>
                }
              >
                <Button>
                  {getLocalizedText(selectedRow, 'OPTI')?.split(',').find((opt) => opt.startsWith(String(newValue)))?.split(':')[1] ||
                    ui.select}{' '}
                  <DownOutlined />
                </Button>
              </Dropdown>
            </p>
          )}

          {selectedRow.TYPE === 'num' && (
            <>
              <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} suffix={selectedRow.unit} />
              <text style={{ marginLeft: '1px' }}>Min: {selectedRow.MIN}{selectedRow.unit}</text>
              <text style={{ marginLeft: '10px' }}>Max: {selectedRow.MAX}{selectedRow.unit}</text>
              <p>
                <VirtualKeyboard
                  onInput={(value) => setNewValue((prev) => prev + value)} // Anhängen der neuen Eingabe
                  onDelete={() => setNewValue((prev) => prev.slice(0, -1))} // Letztes Zeichen löschen
                />
              </p>
            </>
          )}

          {selectedRow.TYPE === 'text' && (
            <>
              <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} />
              <p>
                <SwissKeyboard
                  onInput={setNewValue}
                  onDelete={() => setNewValue((prev) => prev.slice(0, -1))}
                />
              </p>
            </>
          )}
        </Modal>
      )}

      {/* Modal für Beschreibungen */}
      <Modal title={ui.description} open={descriptionModalVisible} onCancel={() => setDescriptionModalVisible(false)} footer={null}>
        <Typography.Paragraph>{description}</Typography.Paragraph>
      </Modal>
    </Layout>
  );
}
