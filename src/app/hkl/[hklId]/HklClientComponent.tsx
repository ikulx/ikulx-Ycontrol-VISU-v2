// app/hkl/[hklId]/HklClientComponent.tsx
'use client';

// button1 = VL Auslegepunkt
// button2 = VL Fusspunkt
// button3 = AT Fusspunkt
// button4 = Hiezgrenze
// button5 = AT Auslegepunkt
// button6 = Totband
// button7 = Sollwert Normal
// button8 = Sollwert Reduziert


// ID 10 = VL MIN
// ID 11 = VL MAX

// ID 20 = Kühlen

import { useState, useEffect } from 'react';
import { Modal, Input, Dropdown, Button, Spin } from "antd";
import type { MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { VirtualKeyboard } from "./VirtualKeyboard"; // Ensure this path is correct

interface DataItem {
  id: number;
  NAME: string;
  VAR_VALUE: string | number;
  unit: string | null;
  HKL_Feld: string;
  MIN?: number;
  MAX?: number;
  OPTI?: string; // Options string in the format "1:Option1,2:Option2,3:Option3"
  TYPE?: string;
}

export default function HklClientComponent({ data: initialData, hklId }: { data: DataItem[], hklId: string }) {
  const [data, setData] = useState<DataItem[]>(initialData);
  const [selectedParam, setSelectedParam] = useState<DataItem | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<{ key: string; label: string }[]>([]);
  const [newValue, setNewValue] = useState<string>("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);

  // Base Path aus Umgebungsvariable
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // Establish SSE connection
  useEffect(() => {
    const eventSource = new EventSource(`${basePath}/api/hkl/${hklId}/sse`);

    eventSource.onmessage = (event) => {
      try {
        const newData: DataItem[] = JSON.parse(event.data);
        setData(newData);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [hklId]);

  // Update dropdown options when data changes
  useEffect(() => {
    if (data.length > 0) {
      const param30 = data.find((param) => param.HKL_Feld === "30");
      if (param30) {
        fetchDropdownOptions(param30);
        setNewValue(param30.VAR_VALUE?.toString() ?? "");
      }
    }
  }, [data]);

  // Fetch dropdown options from the 'OPTI' field
  const fetchDropdownOptions = (param: DataItem) => {
    if (param.OPTI) {
      const options = param.OPTI.split(",").map((opt) => {
        const [key, label] = opt.split(":");
        return { key, label };
      });
      setDropdownOptions(options);
    }
  };

  const handleButtonClick = (param: DataItem) => {
    setSelectedParam(param);
    setNewValue(param.VAR_VALUE?.toString() ?? "");
    setIsModalVisible(true);
    setIsEditing(true);
  };

  const handleDropdownButtonClick = (param: DataItem) => {
    setSelectedParam(param);
    setNewValue(param.VAR_VALUE?.toString() ?? "");
    setIsDropdownVisible(true);
    setIsEditing(true);
    setLoadingOptions(true);

    // Fetch dropdown options
    fetchDropdownOptions(param);
    setLoadingOptions(false);
  };

  const handleDropdownSelect: MenuProps['onClick'] = ({ key }) => {
    setNewValue(key);
    setIsDropdownVisible(false);
    setIsEditing(false);

    if (selectedParam) {
      // Save the new selected value to the backend
      fetch(`${basePath}/api/editor/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedParam.id, VAR_VALUE: key }),
      })
        .then(() => {
          setData((prevData) =>
            prevData.map((item) =>
              item.id === selectedParam.id ? { ...item, VAR_VALUE: key } : item
            )
          );
        })
        .catch((error) => console.error("Error saving:", error));
    }
  };

  const handleSave = () => {
    if (selectedParam) {
      fetch(`${basePath}/api/editor/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedParam.id, VAR_VALUE: newValue }),
      })
        .then(() => {
          setData((prevData) =>
            prevData.map((item) =>
              item.id === selectedParam.id
                ? { ...item, VAR_VALUE: newValue }
                : item
            )
          );
          setIsModalVisible(false);
          setIsEditing(false);
        })
        .catch((error) => console.error("Error saving:", error));
    }
  };

  const getOptionLabel = (value: string) => {
    const option = dropdownOptions.find((opt) => opt.key === value);
    return option ? option.label : value;
  };

  const renderButton = (
    fieldNumber: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const param = data.find((param) => param.HKL_Feld === fieldNumber);
    if (!param) return null;

    return (
      <g onClick={() => handleButtonClick(param)} style={{ cursor: "pointer" }}>
        <rect x={x} y={y} width={width} height={height} fill="#3a485e" />
        <text
          x={x + 6}
          y={y + 20}
          fill="white"
          fontSize="12"
          fontFamily="Arial"
        >
           {param.VAR_VALUE?.toString() ?? ""} {param.unit || ""}
        </text>
      </g>
    );
  };

  const menuItems: MenuProps['items'] = dropdownOptions.map((opt) => ({
    key: opt.key,
    label: opt.label,
  }));

  const menu: MenuProps = {
    items: menuItems,
    onClick: handleDropdownSelect,
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0px",
        margin: "0px",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 818 458"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        <g id="Frame 15315">
          <rect width="818" height="458" fill="black" />

          {/* Buttons for fields */}
          <g id="Frame 8">
            {renderButton("1", 8, 90, 40, 30)} {/* Button for Feld1 */}
            {renderButton("2", 8, 289, 40, 30)} {/* Button for Feld2 */}
            {renderButton("3", 199, 405, 40, 30)} {/* Button for Feld3 */}
            {renderButton("4", 403, 405, 40, 30)} {/* Button for Feld4 */}
            {renderButton("5", 580, 405, 40, 30)} {/* Button for Feld5 */}
            {renderButton("7", 650, 250, 40, 30)} {/* Button for Feld7 */}
            {renderButton("8", 650, 310, 40, 30)} {/* Button for Feld8 */}

            {/* Button for Feld6 */}
            {data.find((param) => param.HKL_Feld === "20")?.VAR_VALUE !== "0" && (
              <g onClick={() => handleButtonClick(data.find((param) => param.HKL_Feld === "6")!)} style={{ cursor: "pointer" }}>
                <rect x="355" y="290" width="40" height="30" fill="#3a485e" />
                <text x="360" y="310" fill="white" fontSize="12" fontFamily="Arial">
                  {data.find((param) => param.HKL_Feld === "6")?.VAR_VALUE || "Feld6"}{" "}
                  {data.find((param) => param.HKL_Feld === "6")?.unit || ""}
                </text>
              </g>
            )}

            {/* New Button with Dropdown (Parameter 30) */}
            {data.find((param) => param.HKL_Feld === "30") && (
              <g onClick={() => handleDropdownButtonClick(data.find((param) => param.HKL_Feld === "30")!)} style={{ cursor: "pointer" }}>
                <rect x="650" y="190" width="115" height="30" fill="#3a485e" />
                <text x="656" y="210" fill="white" fontSize="12" fontFamily="Arial">
                  {getOptionLabel(data.find((param) => param.HKL_Feld === "30")?.VAR_VALUE?.toString() ?? "") || "Parameter 30"}
                </text>
              </g>
            )}
            <text
              id="BetriebsmodusLabel"
              fill="white"
              fontSize="12"
              fontFamily="Arial"
              letterSpacing="0em"
            >
              <tspan x="650" y="184">
                Betriebsmodus
              </tspan>
            </text>

            <text
              id="Sollwernormallable"
              fill="white"
              fontSize="12"
              fontFamily="Arial"
              letterSpacing="0em"
            >
              <tspan x="650" y="245">
                Sollwert Normal
              </tspan>
              <tspan x="650" y="306">
                Sollwert Reduziert
              </tspan>
            </text>

            {/* VL Min */}
            {data.find((param) => param.HKL_Feld === "10") && (
              <text x="256" y="61.8636" fill="white" fontSize="12" fontFamily="Arial">
                VL Min: {data.find((param) => param.HKL_Feld === "10")?.VAR_VALUE} {data.find((param) => param.HKL_Feld === "10")?.unit || ""}
              </text>
            )}

            {/* VL Max */}
            {data.find((param) => param.HKL_Feld === "11") && (
              <text x="411" y="61.8636" fill="white" fontSize="12" fontFamily="Arial">
                VL Max: {data.find((param) => param.HKL_Feld === "11")?.VAR_VALUE} {data.find((param) => param.HKL_Feld === "11")?.unit || ""}
              </text>
            )}

            {/* Cooling */}
            {data.find((param) => param.HKL_Feld === "20")?.VAR_VALUE !== "0" && (
              <g id="Freigabe Kühlen">
                <rect
                  id="Rectangle 1"
                  x="276"
                  y="290"
                  width="46"
                  height="7"
                  fill="#2196F3"
                />
                <path
                  id="Polygon 2"
                  d="M254 293.5L277.25 280.077V306.923L254 293.5Z"
                  fill="#2196F3"
                />
                <text
                  id="Freigabe Kühlen Text"
                  fill="white"
                  fontSize="12"
                  fontFamily="Arial"
                >
                  <tspan x="264" y="316.864">
                    Freigabe
                  </tspan>
                  <tspan x="264" y="331.864">
                    Kühlen
                  </tspan>
                </text>
                <g id="Totband">
                  <path
                    id="TotbandPath"
                    d="M323.004 396.131V231.985"
                    stroke="white"
                    strokeWidth="3"
                    strokeMiterlimit="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <text
                    id="TotbandLabel"
                    fill="white"
                    fontSize="12"
                    fontFamily="Arial"
                    letterSpacing="0em"
                  >
                    <tspan x="353" y="285">
                      Totband
                    </tspan>
                  </text>
                </g>
              </g>
            )}
            <g id="Group">
<path id="Vector" d="M54.4961 67.3176L54.4961 396.131" stroke="white" stroke-miterlimit="3" stroke-linecap="round" stroke-linejoin="round"/>
<path id="Vector_2" d="M54.5002 396.14H787.727" stroke="white" stroke-miterlimit="3" stroke-linecap="round" stroke-linejoin="round"/>
<path id="Vector_3" d="M152.769 362.124C323.373 203.839 538.372 101.615 768.827 69.2132" stroke="white" stroke-width="1.33333" stroke-miterlimit="3" stroke-linecap="square" stroke-dasharray="7 7"/>
<path id="Vector_4" d="M425.894 174.479C533.234 121.59 648.318 86.1507 766.816 69.4961" stroke="white" stroke-width="3" stroke-miterlimit="3" stroke-linecap="round" stroke-linejoin="round"/>
<path id="Vector_5" d="M426.21 174.318L426.213 396.131" stroke="white" stroke-width="3" stroke-miterlimit="3" stroke-linecap="round" stroke-linejoin="round"/>
<path id="Vector_6" d="M323.5 396.138V231.992" stroke="white" stroke-width="3" stroke-miterlimit="3" stroke-linecap="round" stroke-linejoin="round"/>
<path id="Vector_7" d="M425.65 396.132L126.316 396.132" stroke="white" stroke-width="3" stroke-miterlimit="3" stroke-linecap="round" stroke-linejoin="round"/>
<path id="Vector_8" d="M221.399 303.331H54.5056" stroke="white" stroke-width="1.33333" stroke-miterlimit="3" stroke-linecap="square" stroke-dasharray="3 3"/>
<path id="Vector_9" d="M221.785 396.136L221.751 303.056" stroke="white" stroke-width="1.33333" stroke-miterlimit="3" stroke-linecap="square" stroke-dasharray="3 3"/>
<path id="Vector_10" d="M603.012 105.284L54.5048 105.112" stroke="white" stroke-width="1.33333" stroke-miterlimit="3" stroke-linecap="square" stroke-dasharray="3 3"/>
<path id="Vector_11" d="M599.89 396.136V105.109" stroke="white" stroke-width="1.33333" stroke-miterlimit="3" stroke-linecap="square" stroke-dasharray="3 3"/>
</g>
<text id="AT in &#194;&#176;C" fill="white"  font-size="12" letter-spacing="0em"><tspan x="741" y="389.864">AT in &#xb0;C</tspan></text>
<text id="VL in &#194;&#176;C" fill="white"  font-size="12" letter-spacing="0em"><tspan x="34" y="61.8636">VL in &#xb0;C</tspan></text>

            {/* Additional SVG elements here... */}
          </g>
          <g id="Freigabe Heizen">
<rect id="Rectangle 1_2" x="428" y="288" width="47" height="7" fill="#FD2B2B"/>
<path id="Polygon 2_2" d="M497 291.5L473.75 304.923V278.077L497 291.5Z" fill="#FD2B2B"/>
<text id="Freigabe Heizen_2" fill="white"  font-size="12" letter-spacing="0em"><tspan x="441" y="314.864">Freigabe&#10;</tspan><tspan x="441" y="329.864">Heizen</tspan></text>
</g>
        </g>
      </svg>

      {/* Modal for editing parameter values */}
      <Modal
        title={selectedParam?.NAME}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setIsEditing(false);
        }}
        onOk={handleSave}
      >
        <p>
          Min: {selectedParam?.MIN}, Max: {selectedParam?.MAX}
        </p>
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <VirtualKeyboard
          onInput={(input: string) => setNewValue(newValue + input)}
          onDelete={() => setNewValue(newValue.slice(0, -1))}
        />
      </Modal>

      {/* Dropdown Popup */}
      <Modal
        title="Betriebsmodus"
        open={isDropdownVisible}
        onCancel={() => {
          setIsDropdownVisible(false);
          setIsEditing(false);
        }}
        footer={null}
      >
        {loadingOptions ? (
          <Spin />
        ) : (
          <Dropdown menu={menu} trigger={['click']}>
            <Button>
              {getOptionLabel(newValue) || "Option auswählen"} <DownOutlined />
            </Button>
          </Dropdown>
        )}
      </Modal>
    </div>
  );
}
